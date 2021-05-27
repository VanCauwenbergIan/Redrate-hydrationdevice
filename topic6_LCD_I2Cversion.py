from RPi import GPIO
import time
import spidev
from SpiClass import SpiRepository
from displayI2c_Repository import LCDRepositoryI2C
from subprocess import check_output

spi = spidev.SpiDev()

sw_joystick = 22
status = 1
VrX_pot = 0
VrY_pot = 1

rs = 21
e = 20
lijst_pinnen = [16, 12, 25, 24, 23, 26, 19, 13]


def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(sw_joystick, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.add_event_detect(sw_joystick, GPIO.FALLING,
                          callback=callback_switch, bouncetime=300)


def callback_switch(channel):
    global status
    if (GPIO.event_detected(sw_joystick)):
        if status < 3:
            status += 1
        else:
            status = 1
        print(f"Huidige status: {status}")


setup()

try:
    spir = SpiRepository()
    lcd = LCDRepositoryI2C(rs, e)
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
    while True:
        VrX = spir.read_channel(VrX_pot)
        VrY = spir.read_channel(VrY_pot)
        if status == 1:
            lcd.clear_screen()
            lcd.write_message("IP LAN=")
            lcd.new_line()
            lcd.write_message(f"{new_list[0]}")
            time.sleep(1)
            lcd.clear_screen()
            lcd.write_message("IP WIFI=")
            lcd.new_line()
            lcd.write_message(f"{new_list[1]}")
            time.sleep(1)
        elif status == 2:
            lcd.clear_screen()
            aantal_x = round(VrX/64)
            for i in range(0, aantal_x):
                lcd.send_character(219)  # ascii waarde blokje
            lcd.new_line()
            lcd.write_message(f"VRX => {VrX}")
        elif status == 3:
            lcd.clear_screen()
            aantal_y = round(VrY/64)
            for i in range(0, aantal_y):
                lcd.send_character(219)
            lcd.new_line()
            lcd.write_message(f"VRY => {VrY}")
        time.sleep(1)
except KeyboardInterrupt as e:
    print(e)
finally:
    spir.closespi()
    GPIO.cleanup()
