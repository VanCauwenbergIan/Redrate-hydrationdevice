import time
from RPi import GPIO
import threading
from flask.wrappers import Request
import spidev
from subprocess import check_output

from repositories.SpiClass import SpiRepository
from repositories.displayI2c_Repository import LCDRepositoryI2C

from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository


# code hardware
spi = spidev.SpiDev()
spir = SpiRepository()
GPIO.setmode(GPIO.BCM)

hih = 0
vorige_temperatuur = 0
vorige_vochtigheid = 0
periode = 10

rood = 26
groen = 19
blauw = 13

GPIO.setup(rood, GPIO.OUT)
GPIO.setup(blauw, GPIO.OUT)
GPIO.setup(groen, GPIO.OUT)
pwm_rood = GPIO.PWM(rood, 800000)
pwm_blauw = GPIO.PWM(blauw, 800000)
pwm_groen = GPIO.PWM(groen, 800000)


def temperatuur_inlezen():
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


def vochtigheid_inlezen():
    global spir
    global vorige_vochtigheid

    waarde_hih = round(spir.read_channel(hih) * 6.95225)  # voor 100k weerstand
    vochtigheid = round((((waarde_hih/1023)*5) - 0.958)/0.0307, 2)
    # (VOUT - zero offset)/slope
    # (VOUT - 0.958)/0.0307
    # uit datasheet hih4010 (ander serrie = andere waardes of course)

    if (vochtigheid > vorige_vochtigheid + 2.5) or (vochtigheid < vorige_vochtigheid - 2.5):
        print(f"Huidige relative luchtvochtigheid: {vochtigheid}")
        add_log({'datumtijd': None, 'gemetenwaarde': vochtigheid, 'status': None,
                'note': 'relatieve luchtvochtigheid in %', 'deviceid': 3, 'actieid': 4})
        vorige_vochtigheid = vochtigheid


def init_lcd():
    lcd = LCDRepositoryI2C(20, 21)
    lcd.init_lcd()
    ips = check_output(['hostname', '--all-ip-addresses'])
    ip_list = ips.split()
    new_list = []
    for ip in ip_list:
        ip = str(ip)
        length = len(ip) - 1
        ip = ip[2:length]
        new_list.append(ip)
        print(ip)
    lcd.clear_screen()
    if len(new_list) > 1:
        lcd.write_message(f"{new_list[1]}")
    else:
        lcd.write_message(f"{new_list[0]}")


def led():
    pwm_rood.start(25)
    pwm_blauw.start(25)
    pwm_groen.start(25)


def led_notification():
    pwm_rood.start(25)
    pwm_blauw.start(0)
    pwm_groen.start(0)
    time.sleep(1)


# app en socket routes
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


@app.route(endpoint + '/today/temp')
def get_temp():
    data = DataRepository.read_device_today(4)
    if data is not None:
        return jsonify(temperatuur=data), 200
    else:
        return jsonify(message='error'), 404


@app.route(endpoint + '/today/hum')
def get_hum():
    data = DataRepository.read_device_today(3)
    if data is not None:
        return jsonify(vochtigheid=data), 200
    else:
        return jsonify(message='error'), 404
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
    init_lcd()
    while True:
        vochtigheid_inlezen()
        temperatuur_inlezen()
        led()
        time.sleep(1)


thread = threading.Timer(1, main_code)
thread.start()

# led strip interfering with hih :(

# Debugging moet uit staan voor threading
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')

    # Zet de debug op False zodat de threading correct werkt.
    # socketio.run(app, debug=False, host='0.0.0.0')
