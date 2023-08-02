from datetime import datetime

def serialize_datetime(datetime: datetime):
    return {
        'year': datetime.year,
        'month': datetime.month,
        'day': datetime.day,
        'hour': datetime.hour,
        'minute': datetime.minute
    }
