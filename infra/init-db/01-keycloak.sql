-- Keycloak 전용 DB·사용자 (postgres 볼륨이 처음 만들어질 때만 실행됩니다.)
CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak OWNER keycloak;
