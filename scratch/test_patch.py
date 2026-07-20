import datetime
from fastapi.encoders import jsonable_encoder, ENCODERS_BY_TYPE

# Before patch
dt = datetime.datetime(2026, 6, 19, 23, 23, 25)
print("Before patch:", jsonable_encoder(dt))

# Apply patch
ENCODERS_BY_TYPE[datetime.datetime] = lambda d: d.strftime("%Y-%m-%d %H:%M:%S")
ENCODERS_BY_TYPE[datetime.date] = lambda d: d.strftime("%Y-%m-%d")

# After patch
print("After patch:", jsonable_encoder(dt))
print("After patch (date):", jsonable_encoder(dt.date()))
