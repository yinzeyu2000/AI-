import os
import uuid
import httpx
import base64
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. 加载配置
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
# 注意：后端服务器务必使用 service_role key 以绕过权限检查
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 
REMOTE_URL = os.getenv("REMOTE_SERVER_URL")

# 2. 初始化 Supabase 客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Detection System Business Backend")

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/detect")
async def handle_detection(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None) 
):
    """
    核心业务：接收图片 -> 转发推理并获取结果图 -> 双图存入 Supabase -> 返回对比结果
    """
    # 获取用户 ID (可选)
    user_id = None
    if authorization:
        try:
            token = authorization.replace("Bearer ", "")
            user_auth = supabase.auth.get_user(token)
            user_id = user_auth.user.id
        except Exception:
            pass 

    # 读取原始图片内容
    file_content = await file.read()
    file_ext = os.path.splitext(file.filename)[1]
    unique_id = str(uuid.uuid4())
    
    try:
        # 3. 转发给 AI 服务器进行推理
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, file_content, file.content_type)}
            # 开启 return_image 以获取 Base64 结果图
            params = {"save": True, "visualize": True, "return_image": True}
            
            response = await client.post(REMOTE_URL, files=files, params=params, timeout=60.0)
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Remote server inference failed")
            
            inference_data = response.json()
            detections = inference_data.get("detections", [])
            res_base64 = inference_data.get("image_base64")

        # 4. 上传原始图片到 Supabase Storage
        orig_filename = f"orig_{unique_id}{file_ext}"
        orig_path = f"public/{orig_filename}"
        supabase.storage.from_("images").upload(
            path=orig_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        orig_url = supabase.storage.from_("images").get_public_url(orig_path)

        # 5. 处理并上传推理结果图 (Base64)
        result_url = None
        if res_base64:
            # 解码 Base64 为二进制
            result_image_bytes = base64.b64decode(res_base64)
            result_filename = f"res_{unique_id}.jpg"
            result_path = f"public/{result_filename}"
            
            supabase.storage.from_("images").upload(
                path=result_path,
                file=result_image_bytes,
                file_options={"content-type": "image/jpeg"}
            )
            result_url = supabase.storage.from_("images").get_public_url(result_path)

        # 6. 将双图记录存入 Supabase 数据库
        db_record = {
            "user_id": user_id,
            "image_url": orig_url,        # 原图
            "result_image_url": result_url, # 结果图 (新增字段)
            "results": detections,          # 检测框 JSON
        }
        # 使用 service_role 会自动绕过 RLS 检查
        db_res = supabase.table("detections").insert(db_record).execute()

        # 7. 返回结果给前端
        return {
            "status": "success",
            "record_id": db_res.data[0]['id'] if db_res.data else None,
            "orig_url": orig_url,
            "result_url": result_url,
            "detections": detections
        }

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(authorization: str = Header(...)):
    """
    获取用户的检测历史记录
    """
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    
    res = supabase.table("detections")\
        .select("*")\
        .eq("user_id", user.user.id)\
        .order("created_at", desc=True)\
        .execute()
    
    return res.data

if __name__ == "__main__":
    import uvicorn
    # 确保防火墙放行 8080 端口
    uvicorn.run(app, host="0.0.0.0", port=8080)