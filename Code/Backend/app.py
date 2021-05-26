import time
from RPi import GPIO
import threading

from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify
from repositories.DataRepository import DataRepository

# code hardware
GPIO.setmode(GPIO.BCM)
temperatuur = 1
vorige_temperatuur = 0


def temperatuur_inlezen():
    global temperatuur
    global vorige_temperatuur

    temp_sensor = '/sys/bus/w1/devices/28-031997794c5b/w1_slave'
    sensor_file = open(temp_sensor, "r")
    data = sensor_file.read()
    sensor_file.close()
    (discard, sep, reading) = data.partition(' t=')
    temperatuur = round(float(reading) / 1000.0, 2)

    if (temperatuur > vorige_temperatuur + 0.5) or (temperatuur < vorige_temperatuur - 0.5):
        print(f"Huidige temperatuur: {temperatuur}")
        add_log({'datumtijd': None, 'gemetenwaarde': temperatuur, 'status': None,
                'note': 'temperatuur in °C', 'deviceid': 4, 'actieid': 3})
        vorige_temperatuur = temperatuur


app = Flask(__name__)
app.config['SECRET_KEY'] = 'TransRights'

socketio = SocketIO(app, cors_allowed_origins="*", logger=False,
                    engineio_logger=False, ping_timeout=1)
CORS(app)

endpoint = '/api/v1'


# API ENDPOINTS
@app.route('/')
def hallo():
    return jsonify(info='Please go to the endpoint ' + endpoint)

# SOCKET IO


@socketio.on("connect")
def initial_connection():
    print('A new client connects')


@socketio.on_error()        # Handles the default namespace
def error_handler(e):
    print(e)


@socketio.on("F2B_new_logging")
def add_log(msg):
    print(f"received: {msg}")
    s = DataRepository.create_log(
        msg['datumtijd'], msg['gemetenwaarde'], msg['status'], msg['note'], msg['deviceid'], msg['actieid'])
    if s > 0:
        deviceid = msg['deviceid']
        if deviceid in [2, 3, 4]:
            value = msg['gemetenwaarde']
            socketio.emit(
                'B2F_addlog', {'deviceid': deviceid, 'gemetenwaarde': value})
        else:
            status = msg['status']
            socketio.emit(
                'B2F_addlog', {'deviceid': deviceid, 'status': status})


def main_code():
    while True:
        temperatuur_inlezen()
        time.sleep(1)


thread = threading.Timer(1, main_code)
thread.start()

# Debugging moet uit staan voor threading
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')

    # Zet de debug op False zodat de threading correct werkt.
    # socketio.run(app, debug=False, host='0.0.0.0')
