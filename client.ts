import { MessageType } from "./message_type.ts";
import { RequestConfig } from "./request_config.ts";
import { pairingPayload } from "./pairing_payload.ts";
import { waitCondition } from "./utils.ts";

export class Client extends WebSocket {
  #eventsStore: Record<string, any> = {};
  #clientKey: string | null;

  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    this.#clientKey = localStorage.getItem("clientKey");
    this.onmessage = this.#onmessage;
  }

  public async register() {
    // check connection
    await waitCondition(() => this.readyState === 1, 1000);

    const payload: { [k: string]: any } = pairingPayload;

    // add auth token into pairing payload
    if (this.#clientKey) payload["client-key"] = this.#clientKey;

    const id = crypto.randomUUID();
    const res = await this.sendMessage({
      id,
      type: MessageType.REGISTER,
      payload,
    });

    // save the token, after confirming pairing on TV
    if (res?.pairingType === "PROMPT") {
      const res = await this.#getResponseById(id);
      localStorage.setItem("clientKey", res["client-key"]);
      return res;
    }

    return res;
  }

  public sendMessage(
    { id = crypto.randomUUID(), type, uri, payload = {} }: RequestConfig,
  ): Promise<Record<string, any>> {
    const message = { id, type, uri, payload };
    this.send(JSON.stringify(message));
    return this.#getResponseById(id);
  }

  async #getResponseById(id: string): Promise<Record<string, any>> {
    await waitCondition(() => id in this.#eventsStore);
    const payload = this.#eventsStore[id];
    delete this.#eventsStore[id];
    return payload;
  }

  #onmessage(ev: MessageEvent<string>) {
    try {
      const data = JSON.parse(ev.data) as Record<string, any>;
      this.#eventsStore[data.id] = data.payload;
    } catch (e) {
      console.error(e);
    }
  }
}
