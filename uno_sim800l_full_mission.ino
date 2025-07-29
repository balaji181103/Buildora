// This is a complete mission code for a simulated drone using Arduino and SIM800L.
// It includes logic for both getting a mission (GET) and posting status updates (POST).
// It is configured to use the public ngrok URL for communication with the local Next.js server.

#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect SIM800L TX to Arduino pin 10
// Connect SIM800L RX to Arduino pin 11
SoftwareSerial sim(10, 11);

// --- Configuration ---
const char* APN = "airtelgprs.com"; // Change to your mobile carrier's APN
const char* DRONE_ID = "SB-001";     // The ID of this specific drone

// IMPORTANT: Update this URL with the HTTPS one from your ngrok terminal.
// This URL now includes the droneId as a query parameter.
const char* SERVER_URL_GET_MISSION = "https://7f8e8b835319.ngrok-free.app/api/getMission?droneId=SB-001";
const char* SERVER_URL_POST_STATUS = "https://7f8e8b835319.ngrok-free.app/api/updateDroneStatus";


// --- Global Variables for Drone State ---
float current_latitude = 19.0760;  // Starting at Mumbai
float current_longitude = 72.8777;
int battery_level = 98;
String drone_status = "Idle";
String current_order_id = "";


// --- Helper Function to send AT commands ---
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

// --- Helper to check for expected responses ---
bool expectResponse(const String& response, const char* expected) {
    if (response.indexOf(expected) != -1) {
        return true;
    }
    Serial.print("[ERROR] Expected '");
    Serial.print(expected);
    Serial.println("' but did not receive it.");
    return false;
}

// --- Initializes the SIM800L module and GPRS ---
bool initializeSIM() {
    Serial.println("Initializing SIM800L...");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false; // Disable command echo

    Serial.println("Checking network...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    
    // Explicitly set DNS to Google's public DNS for better reliability
    sendATCommand("AT+CDNSCFG=\"8.8.8.8\",\"8.8.4.4\"", 3000);
    
    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) {
      Serial.println("Not attached to GPRS. Retrying...");
      delay(2000);
      if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) return false;
    }
    
    Serial.println("SIM Initialized.");
    return true;
}

// --- Main function to get mission details from server ---
void getMissionDetails() {
    Serial.println("\n--- Requesting new mission ---");

    // 1. Enable GPRS Bearer
    sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 3000);
    String apn_cmd = "AT+SAPBR=3,1,\"APN\",\"";
    apn_cmd += APN;
    apn_cmd += "\"";
    sendATCommand(apn_cmd.c_str(), 3000);
    if(!expectResponse(sendATCommand("AT+SAPBR=1,1", 10000), "OK")){
      Serial.println("GPRS connection failed.");
      sendATCommand("AT+SAPBR=0,1", 3000); // Close bearer on failure
      return;
    }

    // 2. Initialize HTTP and SSL
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    // Enable SSL for HTTPS - THIS IS REQUIRED FOR NGROK
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        sendATCommand("AT+SAPBR=0,1", 3000); // Close bearer
        return;
    }
    
    // 3. Set URL
    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL_GET_MISSION;
    url_cmd += "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) return;

    // 4. Perform GET Action
    sendATCommand("AT+HTTPACTION=0", 1000); // Send command
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    bool actionComplete = false;
    while(millis() - actionStart < 20000) { // 20 second timeout for the action
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
        Serial.println("[ERROR] HTTP GET failed. Check server URL, network, or ngrok status.");
    } else {
      Serial.println("HTTP GET Success. Reading response...");
      sendATCommand("AT+HTTPREAD", 10000); // This command returns the data, we will parse it from the serial buffer
    }

    // 5. Terminate HTTP and GPRS
    sendATCommand("AT+HTTPTERM", 3000);
    sendATCommand("AT+SAPBR=0,1", 3000);
}


void setup() {
    Serial.begin(9600);
    while (!Serial); // Wait for serial monitor to open

    if (initializeSIM()) {
        Serial.println("\nSystem Ready. First mission check in 5 seconds.");
        delay(5000);
    } else {
        Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
        while (true); // Halt system
    }
}

void loop() {
    getMissionDetails();
    Serial.println("\nWaiting 30 seconds before next request...");
    delay(30000); 
}
