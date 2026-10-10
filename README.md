# BreatheIQ

Air-quality monitoring and ML-controlled purification for train cabins.

| Folder | What's inside |
|---|---|
| [`breatheiq/`](breatheiq/) | Web dashboard (React + TypeScript + Vite). See its README to run it. |
| [`ardunio code/`](ardunio%20code/) | Arduino Mega 2560 firmware: DHT11, MQ-2, MQ-135, PMS7003, LCD, fan and ozone relays. |
| [`python code/`](python%20code/) | `final.py`: four Random-Forest heads (scikit-learn) talking to the Arduino over serial and uploading to ThingSpeak. Training data in `TK172529.xlsx`. |

`final.py` reads the ThingSpeak write key from the `THINGSPEAK_API_KEY` environment variable.
