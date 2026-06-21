import uvicorn

if __name__ == "__main__":
    print("Starting backend server with disabled signal handlers for Python 3.14 compatibility...")
    config = uvicorn.Config("main:app", host="0.0.0.0", port=8000)
    server = uvicorn.Server(config=config)
    server.install_signal_handlers = lambda: None  # Disable signal handling
    server.run()

