#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 

// --- SERVER URL ---
// This is your specific public server URL from ngrok.
const char* SERVER_URL = "https://7f8e8b835319.ngrok-free.app";

// --- Drone Configuration ---
const char* DRONE_ID = "SB-001"; // The ID of this specific drone.

// --- Global state for mission ---
char missionOrderId[32] = {0};
float missionLatitude = 0.0;
float missionLongitude = 0.0;

// --- Helper Functions ---
String sendATCommand(const char* command, unsigned long timeout, bool debug = true) {
    String response = "";
    sim.println(command);
    if (debug) {
      Serial.print("Sent: ");
      Serial.println(command);
    }

    unsigned long startTime = millis();
    while (millis() - startTime < timeout) {
        if (sim.available()) {
            char c = sim.read();
            response += c;
        }
    }
    if (debug) {
      Serial.print("Recv: ");
      Serial.println(response);
    }
    return response;
}

bool expectResponse(const String& response, const char* expected) {
    if (response.indexOf(expected) != -1) {
        return true;
    }
    Serial.print("[ERROR] Expected '");
    Serial.print(expected);
    Serial.println("' but did not receive it.");
    return false;
}

bool initializeSIM() {
    Serial.println("Initializing SIM800L...");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false; 

    Serial.println("Checking network...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    
    // Check signal quality
    String csqResponse = sendATCommand("AT+CSQ", 5000);
    if (!expectResponse(csqResponse, "OK")) return false;

    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) {
      Serial.println("Error: Not attached to GPRS.");
      return false;
    }
    
    Serial.println("Setting up GPRS Bearer...");
    sendATCommand("AT+SAPBR=0,1", 3000); // Close any existing bearer
    delay(1000);

    if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 5000), "OK")) return false;

    String cmd = "AT+SAPBR=3,1,\"APN\",\"";
    cmd += APN;
    cmd += "\"";
    if (!expectResponse(sendATCommand(cmd.c_str(), 5000), "OK")) return false;

    if (!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) {
        Serial.println("[ERROR] Failed to open GPRS bearer.");
        return false;
    }

    if (!expectResponse(sendATCommand("AT+SAPBR=2,1", 5000), "OK")) {
        Serial.println("[ERROR] Failed to get an IP address.");
        return false;
    }

    Serial.println("GPRS connection is ready.");
    return true;
}

bool isGprsConnected() {
  String response = sendATCommand("AT+SAPBR=2,1", 3000, false);
  // A valid response will be e.g. +SAPBR: 1,1,"100.107.115.163"
  // If we get an IP, we are connected.
  if (response.indexOf("1,1,") != -1 && response.indexOf("0.0.0.0") == -1) {
    return true;
  }
  return false;
}

// --- Mission Functions ---

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) { // Enable SSL for HTTPS
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL;
    url_cmd += "/api/getMission?droneId=";
    url_cmd += DRONE_ID;
    url_cmd += "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=0", 2000, false); 
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){
           actionResponse = line;
           break;
        }
      }
    }

    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP GET failed. Check server URL and network.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    sendATCommand("AT+HTTPREAD", 10000); 
    
    String jsonResponse = "";
    unsigned long readStart = millis();
    bool jsonStarted = false;
    while(millis() - readStart < 5000) {
      if(sim.available()) {
        char c = sim.read();
        if(c == '{') jsonStarted = true;
        if(jsonStarted) jsonResponse += c;
        if(c == '}' && jsonStarted) break;
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);

    if (jsonResponse.length() > 0) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, jsonResponse);

        if (error) {
            Serial.print("[ERROR] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            missionLatitude = doc["latitude"];
            missionLongitude = doc["longitude"];
            const char* orderId = doc["orderId"];
            strncpy(missionOrderId, orderId, sizeof(missionOrderId) - 1);

            Serial.println("\n--- NEW MISSION ACQUIRED ---");
            Serial.print("Order ID: "); Serial.println(missionOrderId);
            Serial.print("Go to Latitude: "); Serial.println(missionLatitude, 6);
            Serial.print("Go to Longitude: "); Serial.println(missionLongitude, 6);
            Serial.println("----------------------------");
        } else {
            Serial.println("[INFO] No active mission found for this drone.");
            missionOrderId[0] = '\0'; // Clear mission
        }
    } else {
        Serial.println("[ERROR] No JSON object found in HTTP response.");
    }
}

void postDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nPosting drone status...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL;
    url_cmd += "/api/updateDroneStatus";
    url_cmd += "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // --- Create JSON body ---
    String jsonBody;
    DynamicJsonDocument doc(256);
    doc["droneId"] = DRONE_ID;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["battery"] = battery;
    doc["status"] = status;
    serializeJson(doc, jsonBody);

    String data_cmd = "AT+HTTPDATA=";
    data_cmd += jsonBody.length();
    data_cmd += ",10000"; // 10 second timeout to enter data

    if (!expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        Serial.println("Failed to enter data mode.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // Send the JSON data
    if (!expectResponse(sendATCommand(jsonBody.c_str(), 10000), "OK")) {
       Serial.println("Failed to send JSON data.");
       sendATCommand("AT+HTTPTERM", 3000);
       return;
    }

    sendATCommand("AT+HTTPACTION=1", 2000, false); // POST action
    
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){
          if(line.indexOf("200") != -1) {
            Serial.println("Status update successful.");
          }
          break;
        }
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);
}


// --- Arduino Standard Functions ---
void setup() {
    Serial.begin(9600);
    while (!Serial); 

    if (!initializeSIM()) {
        Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
        while (true); 
    }
}

void loop() {
    if (!isGprsConnected()) {
      Serial.println("[WARNING] GPRS Disconnected. Re-initializing...");
      initializeSIM();
      return; // Try again on next loop
    }

    if (missionOrderId[0] == '\0') {
      // No active mission, so let's request one
      getMissionDetails();
    } else {
      // We have a mission, let's post status
      // In a real drone, these values would come from a GPS module and battery sensor.
      float currentLat = 19.1176;
      float currentLon = 72.9060;
      int currentBattery = 85;
      
      postDroneStatus(currentLat, currentLon, currentBattery, "Delivering");
      
      // For this example, we'll say the mission is "complete" after one status update.
      Serial.println("\nMission complete. Clearing mission ID.");
      missionOrderId[0] = '\0';
    }

    Serial.println("\nWaiting 30 seconds before next action...");
    delay(30000); 
}
