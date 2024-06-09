from datetime import datetime as dt

import click
import json
import redis

SENSOR_REGION = "region_0"  # Part of Redis key (namespace)
SENSOR_TYPE = "temperature"  # Part of Redis key (key name)
STREAM_NAME = f"{SENSOR_REGION}:{SENSOR_TYPE}"
CHANNEL_NAME = f"{SENSOR_REGION}:{SENSOR_TYPE}:notify"

def create_measurement_message(event_timestamp: int, sensor_id: int, temperature: float):
    return {
        "timestamp": event_timestamp,
        "sensor_id": sensor_id,
        "temperature": temperature
    }

def add_measurement(redis_conn, event_timestamp: int, sensor_id: int, temperature: float):
    event = create_measurement_message(event_timestamp, sensor_id, temperature)
    redis_conn.xadd(STREAM_NAME, event)

def publish_measurement(redis_conn, event_timestamp:int , sensor_id: int, temperature: float):
    event = create_measurement_message(event_timestamp, sensor_id, temperature)
    redis_conn.publish(CHANNEL_NAME, json.dumps(event))


@click.command
@click.option("--sensor", "-s", help="Sensor ID", type=int, required=True)
@click.option("--temp", "-t", help="Temperature read from the sensor", type=float, required=True)
@click.option("--datetime", "-d", help="UTC date and time in the format ISO-8601", type=str, default=None)
def main(sensor: int, temp: float, datetime: str):
    r = redis.StrictRedis(host='localhost', port=6379, db=0)
    dt_obj = dt.strptime(
        datetime, "%Y-%m-%dT%H:%M:%SZ") if datetime else dt.now()
    ts = int(dt.timestamp(dt_obj))
    add_measurement(r, ts, sensor, temp)
    publish_measurement(r, ts, sensor, temp)
    print("Publish successfully")


if __name__ == "__main__":
    main()
