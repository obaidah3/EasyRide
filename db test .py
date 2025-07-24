import requests

# Firebase Realtime Database URL
url = "https://busticketsystem-c4115-default-rtdb.firebaseio.com/.json"

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    if data:
        print("✅ Data retrieved successfully:\n")
        for key, value in data.items():
            print(f"Bus ID: {value.get('id')}, From: {value.get('from')}, To: {value.get('to')}, Seats: {value.get('seats')}, Time: {value.get('time')}")
    else:
        print("⚠️ No data found in the root node.")
else:
    print(f"❌ Failed to fetch data. Status code: {response.status_code}")
