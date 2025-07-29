#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 

// --- IMPORTANT: Use the http URL provided by ngrok ---
// Your ngrok terminal shows: https://7f8e8b835319.ngrok-free.app
// We will use the http version of it.
const char* SERVER_URL_BASE = "http://7f8e8b835319.ngrok-free.app"; 
const char* DRONE_ID = "SB-001";

// --- Helper Functions ---
String sendATCommand(const char* command, unsigned long timeout) {
    String response = "";
    sim.println(command);
    Serial.print("Sent: ");
    Serial.println(command);

    unsigned long startTime = millis();
    while (millis() - startTime < timeout) {
        if (sim.available()) {
            char c = sim.read();
            response += c;
        }
    }
    Serial.print("Recv: ");
    Serial.println(response);
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

// --- Core Functions ---
bool isGprsConnected() {
    String response = sendATCommand("AT+SAPBR=2,1", 3000);
    // A valid response will contain an IP address like "1.0.0.0" and OK
    if (response.indexOf("1.0.0.0") == -1 && response.indexOf("OK") != -1) {
        Serial.println("[INFO] GPRS not connected.");
        return false;
    }
    Serial.println("[INFO] GPRS is connected.");
    return true;
}

bool initializeSIM() {
    Serial.println("Initializing SIM800L...");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false;

    Serial.println("Checking network...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    if (!expectResponse(sendATCommand("AT+CSQ", 5000), "OK")) return false;
    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) return false;
    
    Serial.println("Setting up GPRS Bearer...");
    sendATCommand("AT+SAPBR=0,1", 3000); 
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

    if (!isGprsConnected()) {
        Serial.println("[ERROR] Failed to get an IP address.");
        return false;
    }

    Serial.println("GPRS connection is ready.");
    return true;
}

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL_BASE;
    url_cmd += "/api/getMission?droneId=";
    url_cmd += DRONE_ID;
    url_cmd += "\"";
    
    Serial.println("Requesting: " + String(url_cmd));
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=0", 2000);
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    bool actionComplete = false;
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){
           actionResponse = line;
           actionComplete = true;
           break;
        }
      }
    }

    if (!actionComplete || actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP GET failed. Check server URL and network.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    Serial.println("HTTP GET Success. Reading response...");
    sendATCommand("AT+HTTPREAD", 10000);
    
    String jsonResponse = "";
    unsigned long readStart = millis();
    bool jsonStarted = false;
    while(millis() - readStart < 5000) {
      if(sim.available()) {
        char c = sim.read();
        Serial.write(c);
        if(c == '{') jsonStarted = true;
        if(jsonStarted) jsonResponse += c;
        if(c == '}' && jsonStarted) break;
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);
    Serial.println("\nExtracted JSON: " + jsonResponse);

    if (jsonResponse.length() > 0) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, jsonResponse);

        if (error) {
            Serial.print("[ERROR] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            // Act on the mission details
        } else {
            Serial.println("[INFO] Server response did not contain mission details.");
        }
    } else {
        Serial.println("[ERROR] No JSON object found in HTTP response.");
    }
}

void postDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nPosting drone status...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL_BASE;
    url_cmd += "/api/updateDroneStatus\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    DynamicJsonDocument doc(256);
    doc["droneId"] = DRONE_ID;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["battery"] = battery;
    doc["status"] = status;

    String jsonData;
    serializeJson(doc, jsonData);
    
    String data_cmd = "AT+HTTPDATA=";
    data_cmd += jsonData.length();
    data_cmd += ",10000"; // length, timeout
    
    if (expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        sendATCommand(jsonData.c_str(), 10000);
    } else {
        Serial.println("[ERROR] Failed to prepare for data submission.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=1", 20000);
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
    Serial.println("\nSystem Ready.");
}

void loop() {
    if (!isGprsConnected()) {
        Serial.println("[RECONNECT] GPRS connection lost. Re-initializing...");
        if (!initializeSIM()) {
            Serial.println("[ERROR] Failed to reconnect. Retrying in 30s.");
            delay(30000);
            return;
        }
    }
    
    getMissionDetails();
    
    Serial.println("\nSimulating mission progress and posting status...");
    // In a real drone, you'd get these values from a GPS and battery sensor.
    postDroneStatus(19.1176, 72.9060, 85, "Delivering");
    
    Serial.println("\nWaiting 30 seconds before next mission check...");
    delay(30000); 
}
