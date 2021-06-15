from RPi import GPIO
import time
from smbus import SMBus

lcd_rs = 21
lcd_e = 20

i2c = None
i2c = SMBus()
i2c.open(1)


class LCDRepositoryI2C:
    def __init__(self, rs_pin=lcd_rs, e_pin=lcd_e):
        self.rs_pin = rs_pin
        self.e_pin = e_pin
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.e_pin, GPIO.OUT)
        GPIO.setup(self.rs_pin, GPIO.OUT)
        GPIO.output(self.e_pin, GPIO.HIGH)

    # write a message to a single line
    def write_message(self, message):
        for letter in message:
            ascii_letter = ord(letter)
            self.send_character(ascii_letter)
            time.sleep(0.1)

    # turn the cursor on
    def cursor_on(self):
        self.send_instruction(0x0E)

    # set the charachters to bytes readable by the display
    def set_data_bits(self, value):
        mask = 0x1
        byte = 0b00000000
        for i in range(0, 8):
            if value & mask:
                byte = byte | 1 << i
            else:
                byte = byte | 0 << i
            mask = mask << 1
        i2c.write_byte(0x38, byte)

    # send an instruction, for the required values lookup the values online or consult the documentation
    def send_instruction(self, value):
        GPIO.output(self.rs_pin, GPIO.LOW)
        self.set_data_bits(value)
        GPIO.output(self.e_pin, GPIO.LOW)
        GPIO.output(self.e_pin, GPIO.HIGH)
        time.sleep(0.01)

    # send a single charachter
    def send_character(self, value):
        GPIO.output(self.rs_pin, GPIO.HIGH)
        self.set_data_bits(value)
        GPIO.output(self.e_pin, GPIO.LOW)
        GPIO.output(self.e_pin, GPIO.HIGH)
        time.sleep(0.01)

    # configure the LCD so it's clear and ready for use
    def init_lcd(self):
        self.send_instruction(0x38)
        self.send_instruction(0x0f)
        self.send_instruction(0x01)

    # set the cursor to the second line
    def new_line(self):
        self.send_instruction(0xC0)

    # test function
    def auto_line(self, message):
        length = 0
        for letter in message:
            length += 1
            ascii_letter = ord(letter)
            self.send_character(ascii_letter)
            if length == 16:
                self.new_line()
            time.sleep(0.1)

    # test function
    def auto_scroll(self, message):
        length = 0
        for letter in message:
            length += 1

            ascii_letter = ord(letter)
            self.send_character(ascii_letter)
            if length == 16:
                self.new_line()
            if length % 16 == 0 and length >= 32:
                time.sleep(0.1)
                line1 = message[length-16:length]
                self.init_lcd()
                for letter in line1:
                    ascii_letter = ord(letter)
                    self.send_character(ascii_letter)
                self.new_line()
            time.sleep(0.1)

    def clear_screen(self):
        self.send_instruction(0x01)

# test code
def main():
    try:
        lcd = LCDRepositoryI2C()
        lcd.init_lcd()
        lcd.write_message('This is')
        lcd.new_line()
        lcd.write_message('literally 1984  ')
        # lcd.auto_scroll(
        #     "This is literally 1984 as written by the author Gregorius Orwil Animal Fram Carol Marks")

    except KeyboardInterrupt as e:
        print(e)
    finally:
        GPIO.cleanup()


if __name__ == '__main__':
    main()
