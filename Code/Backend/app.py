# all the needed imports

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


# setting up the hardware (GPIO pins, classes, input/output)
spi = spidev.SpiDev()
spir = SpiRepository()
GPIO.setmode(GPIO.BCM)

vorige_temperatuur = 0
vorige_vochtigheid = 0
vorige_gewicht = 0
periode = 10
progress = 0
amount = 1.5

# you can change these if you used differnt GPIO pins
rood = 26
groen = 19
blauw = 13
knop = 12
hih = 0

GPIO.setup(rood, GPIO.OUT)
GPIO.setup(blauw, GPIO.OUT)
GPIO.setup(groen, GPIO.OUT)
GPIO.setup(knop, GPIO.IN, GPIO.PUD_UP)
# setup and start the PWM for the ledstrip
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
# hwo to determine the scale ratio:
    # reading = hx.get_raw_data_mean()
    # print(reading)
    # ratio = raw value / weight in g test object
    # test object has a known weight
hx.set_scale_ratio(872.5007320644216)  # for my loadcell

# reading the temperature and writing it to the database


def temperatuur_inlezen():
    global vorige_temperatuur

    # IMPORTANT: the slave address will be different for your sensor! -> temp_sensor = '/sys/bus/w1/devices/address/w1_slave'
    # you should find it by navigating to /sys/bus/w1/devices/w1_bus_master1 in the terminal of your pi (if one-wire is enabled in the Raspberry Pi config and the senor connected correctly)
    temp_sensor = '/sys/bus/w1/devices/28-031997794c5b/w1_slave'
    sensor_file = open(temp_sensor, "r")
    data = sensor_file.read()
    sensor_file.close()
    (discard, sep, reading) = data.partition(' t=')
    temperatuur = round(float(reading) / 1000.0, 2)

    # calling the function that writes to the database when the conditions are met
    if (temperatuur > vorige_temperatuur + 0.5) or (temperatuur < vorige_temperatuur - 0.5):
        print(f"Huidige temperatuur: {temperatuur}")
        add_log({'datumtijd': None, 'gemetenwaarde': temperatuur, 'status': None,
                'note': 'temperatuur in °C', 'deviceid': 4, 'actieid': 3})
        vorige_temperatuur = temperatuur
        # we only write the value to our database if it is reasonably differnt to the previous value (in this case 0.5°C)

# reading the relative humdity and


def vochtigheid_inlezen():
    global spir
    global vorige_vochtigheid

    waarde_hih = round(spir.read_channel(hih) * 6.95225)  # for 100k resistor
    vochtigheid = round((((waarde_hih/1023)*5) - 0.958)/0.0307, 2)
    # (VOUT - zero offset)/slope
    # (VOUT - 0.958)/0.0307
    # from datasheet hih4010 (differnt series = different values of course)

    # calling the function that writes to the database when the conditions are met
    if ((vochtigheid > vorige_vochtigheid + 2.5) or (vochtigheid < vorige_vochtigheid - 2.5)) and vochtigheid > 0 and vochtigheid <= 100:
        print(f"Huidige relative luchtvochtigheid: {vochtigheid}")
        add_log({'datumtijd': None, 'gemetenwaarde': vochtigheid, 'status': None,
                'note': 'relatieve luchtvochtigheid in %', 'deviceid': 3, 'actieid': 4})
        # we only write the  value to our database if it is reasonably differnt to the previous value (in this case 2.5%)
        vorige_vochtigheid = vochtigheid

# setting up the LCD and writing the IP address to it


def init_lcd():
    lcd = LCDRepositoryI2C(20, 21)  # rs, e
    lcd.init_lcd()
    ips = check_output(['hostname', '--all-ip-addresses'])
    ip_list = ips.split()  # get the current IP adresses of the Pi and make a list of them
    new_list = []
    for ip in ip_list:
        ip = str(ip)
        length = len(ip) - 1
        ip = ip[2:length]
        # format them so we get rid of the surounding charachters
        new_list.append(ip)
        print(ip)
    lcd.clear_screen()
    if len(new_list) > 1:
        # There's a LAN address, take the second one instead
        lcd.write_message(f"{new_list[1]}")
    else:
        lcd.write_message(f"{new_list[0]}")  # only a WiFi or LAN address

# writing the current amount of water drunk to the LCD on the second line


def lcd_write_progress():
    lcd = LCDRepositoryI2C(20, 21)
    # set cursor to the first charachter of the second line
    lcd.send_instruction(0xC0)
    lcd.write_message(f"Progress: {round(progress,2)}l")

# ledstrip white, you can tweak the pwm values to adjust the brightness (0-100)


def led_wit():
    pwm_rood.ChangeDutyCycle(100)
    pwm_blauw.ChangeDutyCycle(100)
    pwm_groen.ChangeDutyCycle(100)

# ledstrip red


def led_rood():
    pwm_rood.ChangeDutyCycle(100)
    pwm_blauw.ChangeDutyCycle(0)
    pwm_groen.ChangeDutyCycle(0)

# ledstrip blue


def led_blauw():
    pwm_rood.ChangeDutyCycle(0)
    pwm_blauw.ChangeDutyCycle(100)
    pwm_groen.ChangeDutyCycle(0)

# reading the weight of the bottle


def gewicht_inlezen():
    global vorige_gewicht
    global hx

    gewicht = hx.get_weight_mean(20)  # returns the average of 20 readings
    print(f"{gewicht}g")
    # save the weight in our databse when it meets the conditions and is reasonably different from the previous value (10g)
    if ((gewicht > vorige_gewicht + 10 or (gewicht < vorige_gewicht - 10)) and gewicht > 0 and gewicht <= 1500):
        add_log({'datumtijd': None, 'gemetenwaarde': gewicht, 'status': None,
                'note': 'gewicht in g', 'deviceid': 2, 'actieid': 2})
        vorige_gewicht = gewicht


# app and socket routes
# general setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'TransRights'

socketio = SocketIO(app, cors_allowed_origins="*", logger=False,
                    engineio_logger=False, ping_timeout=1)
CORS(app)

# all links requested of the Flask server by the Front end start with this
endpoint = '/api/v1'


# API ENDPOINTS
@app.route('/')
def hallo():
    return jsonify(info='Please go to the endpoint ' + endpoint)

# GET temperature only


@app.route(endpoint + '/today/temp')
def get_temp():
    data = DataRepository.read_device_today(
        4)  # sensor has id 4 in the database
    if data is not None:
        # return a json of the requested data
        return jsonify(temperatuur=data), 200
    else:
        return jsonify(message='error'), 404

# GET humidity only


@app.route(endpoint + '/today/hum')
def get_hum():
    data = DataRepository.read_device_today(
        3)  # sensor has id 3 in the database
    if data is not None:
        return jsonify(vochtigheid=data), 200
    else:
        return jsonify(message='error'), 404

# GET the current amount of waterdrunk and the minimum daily amount


@app.route(endpoint + '/today/prog')
def get_prog():
    global amount

    data = DataRepository.read_device_today_all(
        2)  # sensor has id 2 in the database
    if data is not None:
        return jsonify(progress=data, globalamount=amount), 200
    else:
        return jsonify(message='error'), 404

# GET both the temperature and humdity (added this later for the conditions that display the possible warning on the homepage)


@app.route(endpoint + '/today/warning')
def get_temp_hum():
    global amount

    temp = DataRepository.read_device_today(4)
    hum = DataRepository.read_device_today(3)
    if temp is not None and hum is not None:
        return jsonify(temperatuur=temp, vochtigheid=hum, globalamount=amount), 200
    else:
        return jsonify(message='error'), 404

# GET the amount of water drunk during the current week


@app.route(endpoint + '/week')
def get_data_thisweek():
    global amount

    data = DataRepository.read_week()
    if data is not None:
        return jsonify(week=data, globalamount=amount), 200
    else:
        return jsonify(message='error'), 404


@socketio.on("connect")
def initial_connection():
    print('A new client connects')


@socketio.on_error()        # Handles the default namespace
def error_handler(e):
    print(e)

# add a new record to the database


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

# we received a json with new settings from the front end!


@socketio.on("F2B_new_settings")
def add_settings(msg):
    global periode
    global amount

    print(f"received: {msg}")
    # amount of time between each time you need to drink
    periode = int(msg['Periode']) * 60
    status = bool(msg['Mode'])  # if this is 0 the Pi will shutdown
    amount = float(msg['DailyAmount'])  # sets a new daily goal
    if status == 0:
        # IMPORTANT: change PASSWORDHERE to your own!
        call("echo W8w00rd | sudo -S shutdown -h now", shell=True)
    print(f"Nieuwe periode: {periode}")
    socketio.emit('B2F_new_settings', {'period': (
        periode / 60), 'dailyamount': amount})

# request setting without writig any new ones to the backend


@socketio.on("F2B_get_settings")
def get_settings():
    global periode
    global amount

    socketio.emit('B2F_settings', {'period': (
        periode / 60), 'dailyamount': amount})

# change the current progress


@socketio.on("F2B_progress")
def check_progress(msg):
    global progress

    print(f"received: {msg}")
    progress = float(msg['Progress'])
    lcd_write_progress()
    print(f"Hoeveelheid water gedronken: {progress}")

# main code in thread


def main_code():
    global amount
    init_lcd()  # set up the LCD
    while True:
        led_rood()  # the LED strip turns red
        GPIO.wait_for_edge(knop, GPIO.RISING)  # wait for a button press
        if progress >= amount:
            led_blauw()  # if the current progress exceeds the daily goal the LED strip will be blue, otherwise it will be white
        else:
            led_wit()
        vochtigheid_inlezen()  # read current humidity
        temperatuur_inlezen()  # read current temperature
        gewicht_inlezen()  # read current weight
        # wait untill enough time has passed to take a sip again (led will turn red again)
        time.sleep(periode)


# start the thread
main_thread = threading.Timer(periode, main_code)
main_thread.start()


# Debugging needs to be turned off for threading to work
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')

    # socketio.run(app, debug=False, host='0.0.0.0')
