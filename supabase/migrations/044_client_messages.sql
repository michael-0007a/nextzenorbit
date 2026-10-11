-- One message thread per client, shared by the client and their assigned team.
-- Only server routes (service role) read/write it; they enforce ownership and assignment.
BEGIN;
CREATE TABLE public.client_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
 from_team boolean NOT NULL,
 body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz
);
CREATE INDEX client_messages_thread ON public.client_messages(client_id,created_at DESC);
CREATE INDEX client_messages_unread_for_team ON public.client_messages(client_id,created_at) WHERE read_at IS NULL AND NOT from_team;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_messages FROM anon,authenticated;
GRANT ALL ON public.client_messages TO service_role;
COMMIT;
