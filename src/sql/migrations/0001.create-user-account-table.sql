CREATE TABLE user_account (id INTEGER GENERATED BY DEFAULT ON NULL AS IDENTITY, username VARCHAR(255) NOT NULL, password VARCHAR(255), locked TIMESTAMP WITH TIME ZONE)
