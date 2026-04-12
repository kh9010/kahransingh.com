# Goose Guard: Setup Guide

A Raspberry Pi-powered remote sound system for scaring geese away from the waterfront. Control it from your phone over WiFi.

---

## How It Works

A Raspberry Pi sits in a weatherproof box near the water, connected to an outdoor speaker. It runs a small web server that you access from your phone at `http://gooseguard.local:5000`. You can tap a button to scare geese immediately, or set it to auto-mode where it plays deterrent sounds at dawn, dusk, and midday on its own.

The system plays randomized goose distress calls, predator sounds (coyote, hawk, eagle), and startle sounds (dog barks, air horns). It never repeats the same pattern, so geese don't get used to it.

```
  Your Phone (on home WiFi)
        |
        | WiFi
        v
  Raspberry Pi (at the water, in weatherproof box)
        |
        | Speaker wire
        v
  Outdoor Speaker (aimed at where geese hang out)
```

---

## Part 1: Shopping List

### Required (~$200 total)

| # | Item | Recommended Product | ~Cost | Notes |
|---|------|-------------------|-------|-------|
| 1 | Raspberry Pi 4 | Model B, 2GB RAM | $45 | The brain of the system |
| 2 | MicroSD card | SanDisk Extreme 32GB | $10 | Stores the OS and sound files |
| 3 | USB-C power supply | CanaKit 5V 3.5A | $10 | Powers the Pi |
| 4 | USB audio adapter | Sabrent USB Audio Adapter | $8 | Better sound quality than the Pi's built-in jack |
| 5 | Outdoor speaker | Pyle PDWR62BTBK (6.5", IP44 weatherproof) | $60 | Loud, weatherproof, wall-mountable |
|   | *Alternative speaker* | *Pyle PLMR24 (3.5" marine-rated, pair)* | *$40* | *Marine-grade, great for waterfront* |
| 6 | Speaker wire | 16-gauge outdoor-rated, 25 ft | $15 | Connects Pi to speaker |
| 7 | Audio adapter | 3.5mm male to bare wire | $6 | Bridges the Pi's audio output to speaker wire |
| 8 | Weatherproof enclosure | BUD Industries NBF-32016 (NEMA 4X) | $25 | Houses the Pi, keeps it completely dry |
| 9 | Cable glands | PG7 and PG9 nylon (10-pack) | $8 | Waterproof cable entry points in the enclosure |
| 10 | Desiccant packs | Silica gel sachets (10-pack) | $5 | Prevents condensation inside the box |
| 11 | Mounting bracket | Stainless steel L-bracket | $5 | Mounts the enclosure to a post or piling |

### Optional: Motion Detection (~$6)

| # | Item | Product | ~Cost | Notes |
|---|------|---------|-------|-------|
| 12 | PIR motion sensor | HC-SR501 | $3 | Detects geese approaching and auto-triggers sounds |
| 13 | Jumper wires | Female-to-female (pack) | $3 | Connects sensor to Pi |

### Where to Buy

Everything is available on Amazon. Search the product names above. The Raspberry Pi is also available from Adafruit, SparkFun, or CanaKit.

---

## Part 2: Sound Files

You need 20-30 sound files across these categories. The more variety, the better — geese habituate to repeated sounds.

### What to Download

| Category | What to Search For | Why It Works |
|----------|-------------------|--------------|
| **Distress** | "Canada goose distress call", "Canada goose alarm call", "Branta canadensis alarm" | Most effective — geese recognize their own species' distress calls and flee |
| **Predator** | "coyote howl", "red-tailed hawk screech", "bald eagle call", "fox bark" | Natural threat sounds that trigger flight response |
| **Startle** | "air horn", "dog bark" (border collie), "gunshot sound effect", "loud clap" | Sudden noise triggers immediate departure |

### Where to Get Them (Free)

1. **xeno-canto.org** — Search "Branta canadensis" for goose calls. Filter by call type. CC-licensed.
2. **freesound.org** — Search for "air horn", "dog bark", "coyote". Free with account.
3. **Macaulay Library** (macaulaylibrary.org) — Cornell's collection of bird sounds. High quality.
4. **Record your own** — Use your phone's voice recorder app near the water.

### File Format

- MP3, WAV, or OGG files all work
- Aim for 5-8 files per category
- Name them descriptively: `coyote-howl-1.mp3`, `goose-distress-2.mp3`, `air-horn-1.mp3`

### Directory Structure

Place files in these folders on the Pi:

```
goose-guard/sounds/
  predator/      ← coyote, hawk, eagle, fox sounds
  distress/      ← goose distress and alarm calls
  startle/       ← air horns, dog barks, bangs
  custom/        ← anything else you want to add
```

---

## Part 3: Setting Up the Raspberry Pi

### Step 1: Flash the SD Card

1. Download **Raspberry Pi Imager** from raspberrypi.com on your computer
2. Insert the microSD card into your computer
3. Open Raspberry Pi Imager, select:
   - **OS:** Raspberry Pi OS Lite (64-bit) — no desktop needed
   - **Storage:** your microSD card
4. Click the **gear icon** (settings) and configure:
   - **Hostname:** `gooseguard`
   - **Enable SSH:** Yes, with password authentication
   - **Username:** `pi`
   - **Password:** choose something you'll remember
   - **WiFi:** enter your home WiFi network name and password
   - **Locale:** set your timezone
5. Click **Write** and wait for it to finish

### Step 2: First Boot

1. Insert the SD card into the Raspberry Pi
2. Plug in the USB-C power supply
3. Wait 2-3 minutes for it to boot and connect to WiFi
4. From your computer (on the same WiFi), open a terminal and type:

```bash
ssh pi@gooseguard.local
```

5. Enter the password you set. You should see a command prompt.

### Step 3: Install the Software

Once SSH'd into the Pi, run these commands:

```bash
# Clone the code from GitHub
git clone https://github.com/kh9010/kahransingh.com.git /tmp/repo
cp -r /tmp/repo/goose-guard /home/pi/goose-guard
rm -rf /tmp/repo

# Run the installer
cd /home/pi/goose-guard
bash install.sh
```

This will:
- Update the Pi's system packages
- Install Python, audio libraries, and all dependencies
- Set up the web server to start automatically on boot
- Configure the audio output

### Step 4: Add Sound Files

Copy your downloaded sound files to the Pi. From your computer:

```bash
# Copy predator sounds
scp ~/Downloads/coyote-howl-1.mp3 pi@gooseguard.local:/home/pi/goose-guard/sounds/predator/

# Copy distress sounds
scp ~/Downloads/goose-distress-1.mp3 pi@gooseguard.local:/home/pi/goose-guard/sounds/distress/

# Copy startle sounds
scp ~/Downloads/air-horn-1.mp3 pi@gooseguard.local:/home/pi/goose-guard/sounds/startle/
```

Or copy them all at once if they're in a folder:

```bash
scp ~/Downloads/predator-sounds/* pi@gooseguard.local:/home/pi/goose-guard/sounds/predator/
scp ~/Downloads/distress-sounds/* pi@gooseguard.local:/home/pi/goose-guard/sounds/distress/
scp ~/Downloads/startle-sounds/* pi@gooseguard.local:/home/pi/goose-guard/sounds/startle/
```

### Step 5: Test It

1. SSH into the Pi and plug headphones or a small speaker into the 3.5mm jack (or USB audio adapter)
2. Restart the service:

```bash
sudo systemctl restart goose-guard
```

3. On your phone, open a browser and go to: **http://gooseguard.local:5000**
4. Tap **SCARE NOW** — you should hear a sound play
5. If it works, you're ready to install at the waterfront

---

## Part 4: Hardware Assembly

### Wiring Diagram

```
[Mains Power] → [USB-C Adapter] → [Raspberry Pi inside NEMA box]
                                          |
                                   [USB Audio Adapter]
                                          |
                                   [3.5mm to bare wire adapter]
                                          |
                                   [Speaker wire through cable gland]
                                          |
                                   [Outdoor Speaker mounted on post]
```

### Assembly Steps

1. **Drill cable gland holes** in the NEMA enclosure:
   - One hole for the USB-C power cable entry
   - One hole for the speaker wire exit
   - (Optional) One hole for the PIR sensor cable

2. **Mount the Pi** inside the enclosure using standoffs or heavy-duty velcro strips

3. **Connect audio:**
   - Plug the USB audio adapter into a USB port on the Pi
   - Connect the 3.5mm-to-bare-wire adapter to the USB audio adapter
   - Connect speaker wire to the bare wire adapter (match polarity: red to red, black to black)
   - Route the speaker wire through a cable gland

4. **Route power:**
   - Thread the USB-C power cable through a cable gland
   - Plug into the Pi

5. **Seal everything:**
   - Tighten all cable glands firmly
   - Drop 2-3 desiccant packs inside the enclosure
   - Close the enclosure lid

6. **Mount the enclosure** on a dock piling, fence post, or dedicated 4x4 post using the L-bracket and screws

7. **Mount the speaker** 6-8 feet high, angled toward the water/grass area where geese congregate. Use the speaker's built-in mounting bracket.

8. **Connect power** — plug the USB-C adapter into the outdoor power outlet (should be GFCI protected)

### Optional: PIR Motion Sensor

If you bought the HC-SR501 PIR sensor:

1. Connect three wires from the sensor to the Pi's GPIO header:
   - VCC (power) → Pi pin 2 (5V)
   - GND (ground) → Pi pin 6 (GND)
   - OUT (signal) → Pi pin 11 (GPIO 17)
2. Mount the sensor facing the area where geese approach
3. Adjust the two small potentiometers on the sensor:
   - Left: sensitivity (turn clockwise for wider range)
   - Right: hold time (turn clockwise for longer trigger)

---

## Part 5: Using the Control Panel

Open **http://gooseguard.local:5000** on your phone. Bookmark it to your home screen for app-like access (on iPhone: Share → Add to Home Screen).

### Controls

| Control | What It Does |
|---------|-------------|
| **SCARE NOW** | Immediately plays a random deterrent sound |
| **Volume** | Slider from 0-100%. Volume varies slightly (+/- 5%) automatically to prevent habituation |
| **Sounds** | Browse all sounds by category, play any specific one |
| **Schedule** | Toggle dawn/dusk/midday sessions on/off |
| **Mode** | Switch between Manual, Auto, and Motion+Auto |
| **Activity Log** | See what sounds played and when |

### Modes

| Mode | Behavior |
|------|----------|
| **Manual** | Only plays when you tap "Scare Now" |
| **Auto** | Plays automatically at dawn (30 min before sunrise, for 45 min), dusk (30 min before sunset, for 45 min), and a random midday burst. Quiet hours 10pm-5am. |
| **Motion + Auto** | Auto schedule plus the PIR sensor triggers a burst of sounds when it detects something |

### Default Schedule

- **Dawn:** starts 30 minutes before sunrise, plays a sound every 2-5 minutes for 45 minutes
- **Dusk:** same pattern around sunset
- **Midday:** 3-sound burst at a random time between 10am-2pm
- **Quiet hours:** no sounds between 10pm and 5am
- Sunrise and sunset times auto-adjust with the seasons

---

## Part 6: Tips for Maximum Effectiveness

### Sound Strategy

- **Add more sounds over time.** The more variety, the longer before geese catch on.
- **Goose distress calls are king.** Prioritize these above all other sound types.
- **Rotate seasonally.** Add a few new sounds every couple months.

### Complementary Deterrents

Sound works best when paired with visual deterrents:

- **Coyote decoy** (~$30) placed near the waterline. Move it to a new spot every week — geese notice if it never moves.
- **Reflective tape** strung along the shoreline at goose head height (~2 feet). The flashing light startles them.
- **Motion-activated sprinkler** — Orbit Yard Enforcer (~$70). Sprays water when it detects movement. Very effective with geese.

### Maintenance

- Check the desiccant packs every few months; replace if they've absorbed moisture
- The Pi can run 24/7 for years without issues
- If WiFi goes down, the Pi will reconnect automatically when it comes back
- Sound files can be added anytime — just SCP new files to the `sounds/` directory and they'll be picked up automatically

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't reach gooseguard.local | Make sure your phone is on the same WiFi. Try the Pi's IP address instead (find it in your router's admin page). |
| No sound plays | SSH in and run: `sudo systemctl status goose-guard` to check if the service is running. Check `sounds/` has .mp3 files. |
| Sound is too quiet | Increase volume in the control panel. Also check `alsamixer` on the Pi (run `alsamixer` in SSH and press up arrow). |
| Sound is distorted | Lower the volume. Check speaker wire connections. |
| Pi won't boot | Re-flash the SD card. Check the power supply is providing enough current (3A minimum). |
| Service won't start | SSH in and run: `cd /home/pi/goose-guard && /home/pi/goose-guard/venv/bin/python app.py` to see error messages. |

---

## Quick Reference Card

```
Control Panel:  http://gooseguard.local:5000
SSH Access:     ssh pi@gooseguard.local
Restart:        sudo systemctl restart goose-guard
View Logs:      sudo journalctl -u goose-guard -f
Add Sounds:     scp file.mp3 pi@gooseguard.local:/home/pi/goose-guard/sounds/predator/
```
