#!/usr/bin/env python3
import RPi.GPIO as GPIO  # import GPIO
from hx711 import HX711  # import the class HX711

try:
    GPIO.setmode(GPIO.BCM)
    hx = HX711(dout_pin=24, pd_sck_pin=23)
    err = hx.zero()
    if err:
        raise ValueError('Tare is unsuccessful.')
    # everything that is the plate / is on the plate gets substracted from the total weight. (still counts for your max limit though)
    reading = hx.get_raw_data_mean()
    print(reading)
    # ratio = raw value / weight in g test object 
    # test object has a known weight
    hx.set_scale_ratio(872.5007320644216)
    while True:
        print(hx.get_weight_mean(20), 'g')

except (KeyboardInterrupt, SystemExit):
    print('STOP')

finally:
    GPIO.cleanup()