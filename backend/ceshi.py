import os
from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. 加载配置
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
# 注意：测试时建议暂时改用 service_role_key 尝试
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 

# 2. 初始化客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="DB Connectivity Test")

@app.get("/test-insert")
async def test_insert():
    """
    最简单的插入测试：不传任何复杂数据，看数据库报不报错
    """
    try:
        # 只插入一个 image_url，避开 user_id 字段的干扰
        test_data = {
            "image_url": "http://test-connection.com/image.jpg",
            "results": {"status": "connection_test_success"}
        }
        
        # 执行插入
        response = supabase.table("detections").insert(test_data).execute()
        
        return {
            "status": "Success",
            "message": "Connected to Supabase successfully!",
            "data": response.data
        }
        
    except Exception as e:
        print(f"Detailed Error: {str(e)}")
        # 这里会打印出完整的错误堆栈，方便观察是哪个环节报错
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # 运行在 8081 端口，避免和你原有的 8080 冲突
    uvicorn.run(app, host="0.0.0.0", port=8081)