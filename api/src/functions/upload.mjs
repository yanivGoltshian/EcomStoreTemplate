import { app } from "@azure/functions";
import { uploadImage } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Image upload. Body: { kind:"product"|"banner"|"brand"|"favicon", base64, contentType, id?, filename? }
app.http("upload", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "upload",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      const body = await readBody(request);
      const result = await uploadImage(body);
      return json(200, { ok: true, ...result });
    } catch (err) {
      return json(400, { error: String(err.message || err) });
    }
  },
});
