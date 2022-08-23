CREATE TABLE homework (
	id UUID UNIQUE DEFAULT uuid_generate_v4(),
	subject VARCHAR(32) NOT NULL,
	description VARCHAR(1024),
	due_date DATE,
	PRIMARY KEY(id)
);

CREATE TABLE homework_attatchments (
	id SERIAL,
	homework_id UUID NOT NULL,
	url VARCHAR(1024) NOT NULL,
	type VARCHAR(16) DEFAULT 'unknown',
	FOREIGN KEY(homework_id) REFERENCES homework(id) ON DELETE CASCADE,
	PRIMARY KEY(id)
);
