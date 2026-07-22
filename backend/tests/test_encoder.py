import datetime
from fastapi.encoders import jsonable_encoder, ENCODERS_BY_TYPE

ENCODERS_BY_TYPE[datetime.datetime] = lambda dt: dt.strftime("%Y-%m-%d %H:%M:%S")

dt = datetime.datetime(2026, 6, 19, 0, 0, 0)
d = {"start_date": dt}
print(jsonable_encoder(d))
