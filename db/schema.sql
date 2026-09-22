-- PostgreSQL + pgvector target schema. Apply to a dedicated database after configuration.
-- The demo does not connect to a database. Adjust vector dimension to the chosen model.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS sources (
 id text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('X_LIST','X_ACCOUNT','RSS','WEBSITE','HACKER_NEWS')),
 locator text NOT NULL, enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS posts (
 id text PRIMARY KEY, source_id text NOT NULL REFERENCES sources(id), external_id text NOT NULL,
 author text NOT NULL, handle text, text text NOT NULL, url text NOT NULL UNIQUE,
 media jsonb NOT NULL DEFAULT '[]', published_at timestamptz NOT NULL,
 classification jsonb NOT NULL, embedding vector(1536) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source_id,external_id)
);
CREATE TABLE IF NOT EXISTS user_profiles (
 user_id uuid PRIMARY KEY, topic_affinities jsonb NOT NULL DEFAULT '{}',
 entity_affinities jsonb NOT NULL DEFAULT '{}', content_type_affinities jsonb NOT NULL DEFAULT '{}',
 interest_embedding vector(1536), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS interactions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid NOT NULL REFERENCES user_profiles(user_id),
 post_id text NOT NULL REFERENCES posts(id), action text NOT NULL CHECK(action IN ('RIGHT','LEFT','SAVE','OPEN')),
 dwell_time integer NOT NULL CHECK(dwell_time>=0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interactions_user_idx ON interactions(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published_at DESC);
-- Access through the authenticated application server only. No public/client table access.
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
