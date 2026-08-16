import time

from app.main import app as real_app


class TimingMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.inner(scope, receive, send)

        t0 = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                dt = (time.perf_counter() - t0) * 1000
                print(f"APP_TIME {scope['path']} {dt:.1f} ms", flush=True)
            await send(message)

        await self.inner(scope, receive, send_wrapper)


app = TimingMiddleware(real_app)