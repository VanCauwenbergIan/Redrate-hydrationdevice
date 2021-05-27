import spidev
from RPi import GPIO
import time
spi = spidev.SpiDev()


class SpiRepository:
    def __init__(self, bus=0, device=0):
        self.bus = bus
        self.device = device

        spi.open(bus, device)
        spi.max_speed_hz = 10 ** 5

    def read_channel(self, channel):
        mask = 0x8
        channel = (mask | channel) << 4

        bytes_out = [0x1, channel, 0x0]
        bytes_in = spi.xfer(bytes_out)
        byte = ((bytes_in[1] & 0x3) << 8) | bytes_in[2]
        waarde = int(byte)
        return waarde

    def closespi(self):
        spi.close()


# test
# try:
#     spir = SpiRepository()
#     waarde = spir.read_channel(0)
#     print(waarde)

# except KeyboardInterrupt as e:
#     print(e)

# finally:
#     spir.closespi()
