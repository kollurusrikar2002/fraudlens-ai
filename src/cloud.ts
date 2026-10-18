export function pdfToText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const parts: string[] = [];
  for (const match of raw.matchAll(/\((?:\\\)|[^)]){2,}\)/g)) {
    const inner = match[0]
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\(.)/g, "$1");
    if (/[A-Za-z]{3}/.test(inner)) parts.push(inner.trim());
  }
  return parts.join("\n").replace(/\s+\n/g, "\n").trim();
}

export async function documentAiText(buffer: Buffer, mime: string): Promise<string | null> {
  const processor = process.env.DOCUMENT_AI_PROCESSOR;
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.DOCUMENT_AI_LOCATION || "us";
  if (!processor || !project) return null;
  const name = processor.includes("/") ? processor : `projects/${project}/locations/${location}/processors/${processor}`;
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) return null;
  const response = await fetch(`https://${location}-documentai.googleapis.com/v1/${name}:process`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ rawDocument: { content: buffer.toString("base64"), mimeType: mime || "application/pdf" } }),
  });
  if (!response.ok) throw new Error(`Document AI ${response.status}`);
  const payload = (await response.json()) as { document?: { text?: string } };
  return payload.document?.text?.trim() || null;
}

export async function publishReview(event: { reference: string; party: string; recommendation: string }) {
  const topic = process.env.PUBSUB_TOPIC;
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!topic || !project) return;
  const name = topic.includes("/") ? topic : `projects/${project}/topics/${topic}`;
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/pubsub"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) return;
  await fetch(`https://pubsub.googleapis.com/v1/${name}:publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ data: Buffer.from(JSON.stringify(event)).toString("base64") }],
    }),
  });
}
