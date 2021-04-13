package expo.modules.updates.manifest

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class NewManifestTest {
    @Test
    @Throws(JSONException::class)
    fun testFromManifestJson_AllFields() {
        // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
        val manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
        val manifest = JSONObject(manifestJson)
        Assert.assertNotNull(NewManifest.fromManifestJson(manifest, null, createConfig()))
    }

    @Test(expected = JSONException::class)
    @Throws(JSONException::class)
    fun testFromManifestJson_NoId() {
        val manifestJson = "{\"runtimeVersion\":\"1\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
        val manifest = JSONObject(manifestJson)
        NewManifest.fromManifestJson(manifest, null, createConfig())
    }

    @Test(expected = JSONException::class)
    @Throws(JSONException::class)
    fun testFromManifestJson_NoCreatedAt() {
        val manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
        val manifest = JSONObject(manifestJson)
        NewManifest.fromManifestJson(manifest, null, createConfig())
    }

    @Test(expected = JSONException::class)
    @Throws(JSONException::class)
    fun testFromManifestJson_NoRuntimeVersion() {
        val manifestJson = "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
        val manifest = JSONObject(manifestJson)
        NewManifest.fromManifestJson(manifest, null, createConfig())
    }

    @Test(expected = JSONException::class)
    @Throws(JSONException::class)
    fun testFromManifestJson_NoLaunchAsset() {
        val manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",}"
        val manifest = JSONObject(manifestJson)
        NewManifest.fromManifestJson(manifest, null, createConfig())
    }

    @Test
    @Throws(JSONException::class)
    fun testFromManifestJson_StripsOptionalRootLevelKeys() {
        val manifestJsonWithRootLevelKeys = "{\"manifest\":{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}}"
        val manifest1: Manifest = NewManifest.fromManifestJson(JSONObject(manifestJsonWithRootLevelKeys), null, createConfig())
        val manifestJsonNoRootLevelKeys = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
        val manifest2: Manifest = NewManifest.fromManifestJson(JSONObject(manifestJsonNoRootLevelKeys), null, createConfig())
        Assert.assertEquals(manifest1.rawManifestJson!!.getString("id"), manifest2.rawManifestJson!!.getString("id"))
    }

    private fun createConfig(): UpdatesConfiguration {
        val configMap = HashMap<String, Any>()
        configMap["updateUrl"] = Uri.parse("https://exp.host/@test/test")
        return UpdatesConfiguration().loadValuesFromMap(configMap)
    }

    @Test
    @Throws(JSONException::class)
    fun testHeaderDictionaryToJSONObject_SupportedTypes() {
        val actual = NewManifest.headerDictionaryToJSONObject("string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5")
        Assert.assertNotNull(actual)
        Assert.assertEquals(5, actual!!.length().toLong())
        Assert.assertEquals("string-0000", actual.getString("string"))
        Assert.assertTrue(actual.getBoolean("true"))
        Assert.assertFalse(actual.getBoolean("false"))
        Assert.assertEquals(47, actual.getInt("integer").toLong())
        Assert.assertEquals(47.5, actual.getDouble("decimal"), 0.0)
    }

    @Test
    @Throws(JSONException::class)
    fun testHeaderDictionaryToJSONObject_IgnoresOtherTypes() {
        val actual = NewManifest.headerDictionaryToJSONObject("branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)")
        Assert.assertNotNull(actual)
        Assert.assertEquals(1, actual!!.length().toLong())
        Assert.assertEquals("rollout-1", actual.getString("branch-name"))
    }

    @Test
    @Throws(JSONException::class)
    fun testHeaderDictionaryToJSONObject_IgnoresParameters() {
        val actual = NewManifest.headerDictionaryToJSONObject("abc=123;a=1;b=2")
        Assert.assertNotNull(actual)
        Assert.assertEquals(1, actual!!.length().toLong())
        Assert.assertEquals(123, actual.getInt("abc").toLong())
    }

    @Test
    fun testHeaderDictionaryToJSONObject_Empty() {
        val actual = NewManifest.headerDictionaryToJSONObject("")
        Assert.assertNotNull(actual)
        Assert.assertEquals(0, actual!!.length().toLong())
    }

    @Test
    fun testHeaderDictionaryToJSONObject_ParsingError() {
        val actual = NewManifest.headerDictionaryToJSONObject("bad dictionary")
        Assert.assertNull(actual)
    }
}