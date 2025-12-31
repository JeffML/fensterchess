// Test Netlify Blobs storage operations
// Phase 0 - Foundation

import { getStore } from "@netlify/blobs";

async function testBlobStorage() {
  console.log("🧪 Testing Netlify Blobs storage...\n");

  const store = getStore("master-games");

  // Test write
  const testData = {
    version: "1.0",
    test: "Phase 0 validation",
    timestamp: new Date().toISOString(),
  };

  console.log("📝 Writing test blob...");
  await store.set("test-phase0", JSON.stringify(testData));
  console.log("✅ Write successful\n");

  // Test read
  console.log("📖 Reading test blob...");
  const retrieved = await store.get("test-phase0");
  const parsed = JSON.parse(retrieved!);
  console.log("Retrieved:", parsed);
  console.log("✅ Read successful\n");

  // Test list
  console.log("📋 Listing blobs...");
  const { blobs } = await store.list();
  console.log(
    "Found blobs:",
    blobs.map((b) => b.key)
  );
  console.log("✅ List successful\n");

  // Cleanup
  console.log("🧹 Cleaning up...");
  await store.delete("test-phase0");
  console.log("✅ Delete successful\n");

  console.log("🎉 All blob storage tests passed!");
}

testBlobStorage().catch((error) => {
  console.error("❌ Blob storage test failed:", error);
  process.exit(1);
});
