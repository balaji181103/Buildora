
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Remember to connect the SIM800L's VCC to an external 5V 2A power supply
// and connect the GND of the power supply to the Arduino's GND.
SoftwareSerial sim(10, 11);  // Arduino UNO TX (to SIM RX) -> 10, RX (from SIM TX) -> 11

// --- Configuration ---
// 1. Run your server: `npm run dev`
// 2. Run ngrok: `ngrok http 9002`
// 3. Copy the ngrok Forwarding URL here. Use the http version.
const char* SERVER_URL = "http://<your-ngrok-url>.ngrok-free.app/api/getMission?droneId=SB-001";

// --- Helper Functions ---
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print("Sent: ");
  Serial.println(command);

  String response = "";
  while (millis() - startTime < timeout) {
    if (sim.available()) {
      char c = sim.read();
      response += c;
    }
    if (response.indexOf(expected_response) != -1) {
      Serial.print("Recv: ");
      Serial.println(response);
      return true;
    }
  }
  Serial.print("\n[ERROR] Timeout or incorrect response. Full response received:\n");
  Serial.println(response);
  return false;
}

String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  // This loop will wait for the HTTP response body, which starts with '{'
  while (millis() - startTime < 10000) { // 10 second timeout for response
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') {
        foundJson = true; // Start capturing once we find the opening brace
      }
      if (foundJson) {
        response += c;
      }
      // If we've found a JSON object and it ends, we can stop.
      if (c == '}' && foundJson) {
        break;
      }
    }
  }
  return response;
}

bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Echo off
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false;
  
  Serial.println("Attaching to GPRS...");
  if (!sendATCommand("AT+CGATT=1", "OK", 10000)) return false;
  
  // Set up the GPRS context using SAPBR
  if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 5000)) return false;
  if (!sendATCommand("AT+SAPBR=3,1,\"APN\",\"airtelgprs.com\"", "OK", 5000)) return false;
  
  // Open the GPRS bearer
  Serial.println("Opening GPRS bearer...");
  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) {
    Serial.println("Failed to open GPRS bearer. Trying to close and reopen...");
    sendATCommand("AT+SAPBR=0,1", "OK", 5000); // Close it first
    delay(2000);
    if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) return false; // Try again
  }

  // Query the IP address to confirm connection
  if (!sendATCommand("AT+SAPBR=2,1", "OK", 10000)) return false;

  Serial.println("SIM Initialized and GPRS Connected.");
  return true;
}

void getCustomerDetails() {
  Serial.println("\nInitializing HTTP for GET request...");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;

  // This command associates the HTTP session with our active GPRS bearer
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;
  
  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";

  Serial.println("Requesting Mission from: " + String(SERVER_URL));
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }
  
  // Start the GET request. Expect "0,200" for a successful request (Action=0, Code=200)
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET request failed. Check server and URL.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  Serial.println("Reading HTTP Response...");
  // The "AT+HTTPREAD" command itself will output the response body.
  if (!sendATCommand("AT+HTTPREAD", "OK", 10000)) {
     Serial.println("[ERROR] Failed to read HTTP response.");
     sendATCommand("AT+HTTPTERM", "OK", 2000);
     return;
  }

  // The previous command's response is what we need to parse
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  // Terminate HTTP session
  sendATCommand("AT+HTTPTERM", "OK", 2000);

  // --- Parse the JSON ---
  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parsing Failed: ");
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n--- Mission Details Received ---");
      Serial.print("Order ID : ");
      Serial.println(orderId);
      Serial.print("Latitude : ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("Longitude: ");
      Serial.println(longitude, 6); // Print with 6 decimal places
      Serial.println("------------------------------");
    } else if (jsonResponse == "{}") {
      Serial.println("No mission currently available for this drone.");
    }
     else {
      Serial.println("[ERROR] JSON received, but it does not contain 'latitude' and 'longitude' keys.");
    }
  } else {
    Serial.println("[ERROR] No JSON object was found in the HTTP response.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial monitor to open

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' and press Enter to GET customer location.");
  } else {
    Serial.println("\n[FATAL] Could not initialize SIM card. Check wiring, power, and signal.");
    while (true); // Halt execution
  }
}

void loop() {
  // Check for commands from the Serial Monitor
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // Pass-through any unexpected data from SIM800L for debugging
  while (sim.available()) {
    Serial.write(sim.read());
  }
}
