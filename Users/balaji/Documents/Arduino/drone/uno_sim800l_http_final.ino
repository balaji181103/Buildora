#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com";
// Use your ngrok HTTP URL here. Make sure it's HTTP, not HTTPS.
const char* SERVER_URL = "http://replace-this-with-your-ngrok-url.ngrok-free.app/api/getMission?droneId=SB-001";

// --- Helper Functions ---
String sendATCommand(const char* command, unsigned long timeout) {
  String response = "";
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print("Sent: ");
  Serial.println(command);

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

String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  // First, wait for the HTTPREAD confirmation
  while (millis() - startTime < 5000) {
    if (sim.available()) {
      response = sim.readString();
      if(response.indexOf("+HTTPREAD:") != -1) {
        break;
      }
    }
  }
  
  // The actual JSON is usually after the first line break
  int jsonStart = response.indexOf('{');
  int jsonEnd = response.lastIndexOf('}');
  if (jsonStart != -1 && jsonEnd != -1) {
    return response.substring(jsonStart, jsonEnd + 1);
  }

  return "";
}

bool initializeSIM() {
  Serial.println("Initializing SIM800L...");
  sim.begin(9600);
  delay(1000);

  if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
  if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false; // Echo off
  if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
  if (!expectResponse(sendATCommand("AT+CSQ", 2000), "OK")) return false;
  
  Serial.println("Checking GPRS attachment...");
  if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) {
      Serial.println("GPRS not attached. Please check signal/SIM.");
      return false;
  }

  // Set up GPRS context
  if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 3000), "OK")) return false;
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"";
  apnCmd += APN;
  apnCmd += "\"";
  if (!expectResponse(sendATCommand(apnCmd.c_str(), 3000), "OK")) return false;

  // Open the bearer/connection
  Serial.println("Opening GPRS bearer...");
  if (!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) {
      Serial.println("Failed to open GPRS bearer. Closing and retrying...");
      sendATCommand("AT+SAPBR=0,1", 5000); // Close bearer
      delay(2000);
      if(!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) {
        Serial.println("[FATAL] Could not establish GPRS connection.");
        return false;
      }
  }

  // Get IP Address
  if (!expectResponse(sendATCommand("AT+SAPBR=2,1", 5000), "+SAPBR: 1,1")) {
      Serial.println("Failed to get an IP address.");
      return false;
  }
  
  Serial.println("SIM Initialized and GPRS Connected.");
  return true;
}

bool isGprsConnected() {
    String response = sendATCommand("AT+SAPBR=2,1", 3000);
    // +SAPBR: 1,1,"x.x.x.x" means it's connected
    if (response.indexOf("+SAPBR: 1,1,") != -1) {
        Serial.println("GPRS connection is active.");
        return true;
    }
    Serial.println("GPRS connection is down.");
    return false;
}

void getMissionDetails() {
  Serial.println("\n--- Requesting New Mission ---");
  
  // Start HTTP session
  if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) {
    Serial.println("[ERROR] Failed to initialize HTTP.");
    return;
  }

  // Set HTTP parameters
  if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 3000), "OK")) return;
  
  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";
  if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) return;

  // Perform GET action
  Serial.println("Sending GET request...");
  String actionResponse = sendATCommand("AT+HTTPACTION=0", 20000);
  if (!expectResponse(actionResponse, "+HTTPACTION: 0,200")) {
    Serial.println("[ERROR] HTTP GET action failed.");
    sendATCommand("AT+HTTPTERM", 3000); // Terminate on failure
    return;
  }

  // Read the response from the server
  Serial.println("Reading HTTP response...");
  sendATCommand("AT+HTTPREAD", 10000);
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);
  
  // Terminate HTTP session
  sendATCommand("AT+HTTPTERM", 3000);
  
  // Process the JSON data
  if (jsonResponse.length() > 2) { // Check for more than just "{}"
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parse Failed: ");
      Serial.println(error.f_str());
      return;
    }
    
    if (doc.size() == 0) {
        Serial.println("No mission found (empty JSON object received).");
        return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n--- Mission Details ---");
      Serial.print("Order ID:  ");
      Serial.println(orderId);
      Serial.print("Latitude:  ");
      Serial.println(latitude, 6);
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("------------------------\n");
    } else {
      Serial.println("[ERROR] Valid JSON received but required keys 'latitude' or 'longitude' are missing.");
    }
  } else {
    Serial.println("No mission data received from server.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial);

  if (!initializeSIM()) {
      Serial.println("\n[FATAL] Could not connect to network. Halting.");
      while(true); // Stop execution
  }
  
  Serial.println("\nSystem Ready. Requesting first mission in 5 seconds...");
  delay(5000);
}

void loop() {
  if (!isGprsConnected()) {
    Serial.println("Re-initializing SIM...");
    initializeSIM(); // Attempt to reconnect
  } else {
    getMissionDetails();
  }
  
  Serial.println("Waiting 30 seconds before next request...");
  delay(30000);
}
