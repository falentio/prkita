CREATE TABLE homework (
	id UUID UNIQUE DEFAULT uuid_generate_v4(),
	subject VARCHAR(32) NOT NULL,
	description VARCHAR(1024),
	due_date TIMESTAMPTZ,
	PRIMARY KEY(id)
);

CREATE TABLE homework_attatchments (
	id UUID UNIQUE NOT NULL,
	url VARCHAR(1024) NOT NULL,
	type VARCHAR(16),
	FOREIGN KEY(id) REFERENCES homework(id) ON DELETE CASCADE,
	PRIMARY KEY(id)
);
