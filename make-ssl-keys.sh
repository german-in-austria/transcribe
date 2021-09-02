# Generate a passphrase
openssl rand -base64 48 > ./certs/passphrase.txt

# Generate a Private Key
openssl genrsa -aes128 -passout file:./certs/passphrase.txt -out ./certs/server.key 2048

# Generate a CSR (Certificate Signing Request)
openssl req -new -passin file:./certs/passphrase.txt -key ./certs/server.key -out ./certs/server.csr \
    -subj "/C=FR/O=krkr/OU=Domain Control Validated/CN=*.krkr.io"

# Remove Passphrase from Key
cp ./certs/server.key ./certs/server.key.org
openssl rsa -in ./certs/server.key.org -passin file:./certs/passphrase.txt -out ./certs/server.key

# Generating a Self-Signed Certificate for 100 years
openssl x509 -req -days 36500 -in ./certs/server.csr -signkey ./certs/server.key -out ./certs/server.crt

mv ./certs/server.crt ./certs/ssl.crt
mv ./certs/server.key ./certs/ssl.key
