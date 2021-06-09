import time
from RPi import GPIO
import threading
from flask.wrappers import Request
import spidev
from subprocess import check_output, call

from repositories.SpiClass import SpiRepository
from repositories.displayI2c_Repository import LCDRepositoryI2C

from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository
from repositories.hx711 import HX711


# code hardware
spi = spidev.SpiDev()
spir = SpiRepository()
GPIO.setmode(GPIO.BCM)

vorige_temperatuur = 0
vorige_vochtigheid = 0
vorige_gewicht = 0
periode = 10
progress = 0

rood = 26
groen = 19
blauw = 13
knop = 12
hih = 0

GPIO.setup(rood, GPIO.OUT)
GPIO.setup(blauw, GPIO.OUT)
GPIO.setup(groen, GPIO.OUT)
GPIO.setup(knop, GPIO.IN, GPIO.PUD_UP)
pwm_rood = GPIO.PWM(rood, 100)
pwm_blauw = GPIO.PWM(blauw, 100)
pwm_groen = GPIO.PWM(groen, 100)

pwm_rood.start(0)
pwm_blauw.start(0)
pwm_groen.start(0)

hx = HX711(dout_pin=24, pd_sck_pin=23)
err = hx.zero()
if err:
    raise ValueError('Tare is unsuccessful.')
# everything that is the plate / is on the plate gets substracted from the total weight. (still counts for your max limit though)
# reading = hx.get_raw_data_mean()
# print(reading)
# ratio = raw value / weight in g test object
# test object has a known weight
hx.set_scale_ratio(872.5007320644216)


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

    if ((vochtigheid > vorige_vochtigheid + 2.5) or (vochtigheid < vorige_vochtigheid - 2.5)) and vochtigheid > 0 and vochtigheid <= 100:
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


def lcd_write_progress():
    lcd = LCDRepositoryI2C(20, 21)
    lcd.send_instruction(0xC0)
    lcd.write_message(f"Progress: {round(progress,2)}l")


def led_wit():
    pwm_rood.ChangeDutyCycle(25)
    pwm_blauw.ChangeDutyCycle(25)
    pwm_groen.ChangeDutyCycle(25)


def led_rood():
    pwm_rood.ChangeDutyCycle(25)
    pwm_blauw.ChangeDutyCycle(0)
    pwm_groen.ChangeDutyCycle(0)


def led_blauw():
    pwm_rood.ChangeDutyCycle(0)
    pwm_blauw.ChangeDutyCycle(25)
    pwm_groen.ChangeDutyCycle(0)


def gewicht_inlezen():
    global vorige_gewicht
    global hx

    gewicht = hx.get_weight_mean(20)
    print(f"{gewicht}g")
    if ((gewicht > vorige_gewicht + 10 or (gewicht < vorige_gewicht - 10)) and gewicht > 0 and gewicht <= 1500):
        add_log({'datumtijd': None, 'gemetenwaarde': gewicht, 'status': None,
                'note': 'gewicht in g', 'deviceid': 2, 'actieid': 2})
        vorige_gewicht = gewicht


init_lcd()

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


@app.route(endpoint + '/today/prog')
def get_prog():
    data = DataRepository.read_device_today_all(2)
    if data is not None:
        return jsonify(progress=data), 200
    else:
        return jsonify(message='error'), 404


@app.route(endpoint + '/today/warning')
def get_temp_hum():
    temp = DataRepository.read_device_today(4)
    hum = DataRepository.read_device_today(3)
    if temp is not None and hum is not None:
        return jsonify(temperatuur=temp, vochtigheid=hum), 200
    else:
        return jsonify(message='error'), 404


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


@socketio.on("F2B_new_settings")
def add_settings(msg):
    global periode

    print(f"received: {msg}")
    periode = int(msg['Periode']) * 60
    status = bool(msg['Mode'])
    if status == 0:
        call("echo W8w00rd | sudo -S shutdown -h now", shell=True)
    print(f"Nieuwe periode: {periode}")
    socketio.emit('B2F_new_settings', {'period': (periode / 60)})


@socketio.on("F2B_request_settings")
def get_settings():
    global periode
    if ((periode / 60) >= 1):
        socketio.emit('B2F_settings', {'period': (periode / 60)})


@socketio.on("F2B_progress")
def check_progress(msg):
    global progress

    print(f"received: {msg}")
    progress = float(msg['Progress'])
    lcd_write_progress()
    print(f"Hoeveelheid water gedronken: {progress}")


def main_code():
    while True:
        led_rood()
        GPIO.wait_for_edge(knop, GPIO.RISING)
        if progress >= 1.5:
            led_blauw()
        else:
            led_wit()
        vochtigheid_inlezen()
        temperatuur_inlezen()
        gewicht_inlezen()
        time.sleep(periode)


main_thread = threading.Timer(periode, main_code)
main_thread.start()


# Debugging moet uit staan voor threading
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')

    # Zet de debug op False zodat de threading correct werkt.
    # socketio.run(app, debug=False, host='0.0.0.0')
