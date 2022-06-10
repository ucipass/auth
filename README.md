# Summary
Authentication microservice using SAML hosted in OKTA with a Redis session backend database.

Parameters:
- Identity Provider public cert: Provided by Okta
- SAML Login entryPoint: Provided by Okta
- SAML LogoutUrl: Provided by Okta
- SAML Login Callback path: /auth/saml/callback (GET)
- SAML Logout Callback path: /auth/saml/callback (POST)
- SignatureAlgorithm: "sha256"
- digestAlgorithm: "sha256",
- Service Provider private key: (See below example for creating one, public key is requred by SAML IDP)

### Local SP certificate for secure logout
 
```
openssl x509 \ 
    -in <( 
        openssl req \ 
            -days 3650 \ 
            -newkey rsa:4096 \ 
            -nodes \ 
            -keyout "${certname}.key" \ 
            -subj "/C=${CRT_C:-"US"}/L=${CRT_L:-"Naperville"}/O=${CRT_O:-"IT"}/OU=${CRT_OU:-"Sysadmins"}/CN=${CRT_CN:-"MySAML"}" 
        ) \ 
    -req \ 
    -signkey "${certname}.key" \ 
    -sha256 \ 
    -days 3650 \ 
    -out "${certname}.crt" \ 
    -extfile <(echo -e "basicConstraints=critical,CA:true,pathlen:0") 
```