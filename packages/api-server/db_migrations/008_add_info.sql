
ALTER TABLE server_roles DROP CONSTRAINT server_roles_server_id_key;
ALTER TABLE server_roles ADD COLUMN is_read_only BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS server_intel (
  server_id INT NOT NULL,
  zone_id INT NOT NULL,
  intel VARCHAR (2048) NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_updated_by INT NOT NULL DEFAULT 1,
  PRIMARY KEY(server_id, zone_id)
);

ALTER TYPE user_action_enum ADD VALUE 'intel';