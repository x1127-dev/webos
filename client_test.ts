import { assertObjectMatch } from "./deps_test.ts";
import { Client } from "./client.ts";
import { MessageType } from "./message_type.ts";

Deno.test("client", async (test) => {
  const url = Deno.args[0];
  if (!url) {
    throw new Error(`WebSocket URL not found! Pass URL as first CLI argument`);
  }
  const client = new Client(url);

  await client.register();

  await test.step("volumeUp", async () => {
    const res = await client.sendMessage({
      type: MessageType.REQUEST,
      uri: "ssap://audio/volumeUp",
    });
    assertObjectMatch({ returnValue: true }, res);
  });

  await test.step("volumeDown", async () => {
    const res = await client.sendMessage({
      type: MessageType.REQUEST,
      uri: "ssap://audio/volumeUp",
    });
    assertObjectMatch({ returnValue: true }, res);
  });

  client.close();
  Deno.exit(0);
});
