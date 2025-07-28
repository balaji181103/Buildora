#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 

// --- IMPORTANT ---
// The URL below MUST be a PUBLIC URL. Your Next.js app runs on your local computer, which is not on the public internet.
// For testing, you must use a service like ngrok to create a temporary public URL for your local server.
// 1. Run your Next.js app: npm run dev (it runs on port 9002)
// 2. Run ngrok: ngrok http 9002
// 3. Copy the 'Forwarding' URL from the ngrok terminal and paste it here.
//
// When you deploy your app to a real server (like Firebase App Hosting), you will get a permanent URL to replace this.
const char* SERVER_URL = "http://<YOUR_NGROK_OR_PUBLIC_URL>"; // <-- PASTE YOUR NGROK URL HERE

const char* DRONE_ID = "SB-001";

// --- Helper Functions ---
// Sends an AT command and waits for a specific expected response.
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
  }
  
  Serial.print("Recv: ");
  Serial.println(response);
  
  if (response.indexOf(expected_response) != -1) {
    return true;
  }
  
  Serial.println("[ERROR] Timeout or incorrect response.");
  return false;
}

// Reads the JSON part of an HTTP response
String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  while (millis() - startTime < 10000) { // Increased timeout for response reading
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') foundJson = true;
      if (foundJson) response += c;
      if (c == '}' && foundJson) break;
    }
  }
  return response;
}

// Establishes a GPRS connection with the network
bool initializeGPRS() {
  Serial.println("Initializing GPRS...");

  if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 5000)) return false;

  String cmd = "AT+SAPBR=3,1,\"APN\",\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 5000)) return false;

  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) {
    Serial.println("[ERROR] Failed to open GPRS bearer.");
    return false;
  }
  
  if (!sendATCommand("AT+SAPBR=2,1", "OK", 5000)) {
     Serial.println("[ERROR] Failed to get an IP address.");
     return false;
  }

  Serial.println("GPRS connection is ready.");
  return true;
}

// Initializes the SIM module
bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Disable command echo

  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 5000)) return false;
  
  if (!sendATCommand("AT+CGATT?", "+CGATT: 1", 5000)) {
    Serial.println("[ERROR] Not attached to GPRS.");
    return false;
  }

  return initializeGPRS();
}


// --- Mission Logic ---
void getMissionDetails() {
  Serial.println("\n--- GETTING MISSION ---");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;

  String get_url = String(SERVER_URL) + "/api/getMission?droneId=" + String(DRONE_ID);
  String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
  
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 3000);
    return;
  }

  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET failed.");
  } else {
    Serial.println("Reading Mission Response...");
    sendATCommand("AT+HTTPREAD", "OK", 10000);
    String jsonResponse = readHttpResponse();
    Serial.println("Extracted JSON: " + jsonResponse);

    if (jsonResponse.length() > 0) {
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, jsonResponse);
      if (!error && doc.containsKey("latitude") && doc.containsKey("longitude")) {
        Serial.println("Mission Received!");
        // Add your mission logic here
      } else {
        Serial.println("No mission found or JSON invalid.");
      }
    }
  }

  sendATCommand("AT+HTTPTERM", "OK", 3000); // Terminate HTTP session
}

void postDroneStatus() {
  Serial.println("\n--- POSTING STATUS ---");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  
  if(!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  String post_url = String(SERVER_URL) + "/api/updateDroneStatus";
  String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 3000);
    return;
  }

  if(!sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 5000)) return;

  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["droneId"] = DRONE_ID;
  doc["latitude"] = 19.1234; // Replace with actual GPS data
  doc["longitude"] = 72.5678; // Replace with actual GPS data
  doc["battery"] = 95; // Replace with actual battery data
  doc["status"] = "Idle";

  String payload;
  serializeJson(doc, payload);
  
  String data_cmd = "AT+HTTPDATA=" + String(payload.length()) + ",10000";
  if (sendATCommand(data_cmd.c_str(), "DOWNLOAD", 10000)) {
      sim.println(payload);
      Serial.println("Sent Payload: " + payload);
  }

  // Wait for the OK after payload is sent
  delay(1000); // Give module time to process and send
  
  if (!sendATCommand("AT+HTTPACTION=1", "+HTTPACTION: 1,200", 20000)) {
      Serial.println("[ERROR] HTTP POST failed.");
  } else {
      Serial.println("Status POST successful.");
      sendATCommand("AT+HTTPREAD", "OK", 10000); // Read server response
  }

  sendATCommand("AT+HTTPTERM", "OK", 3000); // Terminate HTTP session
}


// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial);

  if (!initializeSIM()) {
    Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
    while (true);
  }
  Serial.println("\nSystem Ready.");
}

void loop() {
  getMissionDetails();
  
  Serial.println("\nPausing for 10 seconds...");
  delay(10000);
  
  postDroneStatus();

  Serial.println("\nCycle complete. Waiting 30 seconds...");
  delay(30000);
}
