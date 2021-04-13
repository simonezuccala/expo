package expo.modules.updates.manifest

import android.net.Uri
import android.util.Log
import expo.modules.structuredheaders.BooleanItem
import expo.modules.structuredheaders.NumberItem
import expo.modules.structuredheaders.Parser
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.loader.EmbeddedLoader
import expo.modules.updates.manifest.raw.NewRawManifest
import expo.modules.updates.manifest.raw.RawManifest
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.text.ParseException
import java.util.*

class NewManifest private constructor(override val rawManifestJson: NewRawManifest,
                                      private val mId: UUID,
                                      private val mScopeKey: String,
                                      private val mCommitTime: Date,
                                      private val mRuntimeVersion: String,
                                      private val mLaunchAsset: JSONObject,
                                      private val mAssets: JSONArray?,
                                      private val mServerDefinedHeaders: String?,
                                      private val mManifestFilters: String?) : Manifest {
    override val serverDefinedHeaders: JSONObject?
        get() = if (mServerDefinedHeaders == null) {
            null
        } else headerDictionaryToJSONObject(mServerDefinedHeaders)

    override val manifestFilters: JSONObject?
        get() = if (mManifestFilters == null) {
            null
        } else headerDictionaryToJSONObject(mManifestFilters)

    override val updateEntity: UpdateEntity
        get() = UpdateEntity(mId, mCommitTime, mRuntimeVersion, mScopeKey).apply {
            metadata = rawManifestJson.getRawJson()
        }

    override val assetEntityList: List<AssetEntity>
        get() {
            val assetList = mutableListOf<AssetEntity>()
            try {
                assetList.add(AssetEntity(mLaunchAsset.getString("key"), mLaunchAsset.getString("contentType")).apply {
                    url = Uri.parse(mLaunchAsset.getString("url"))
                    isLaunchAsset = true
                    embeddedAssetFilename = EmbeddedLoader.BUNDLE_FILENAME
                })
            } catch (e: JSONException) {
                Log.e(TAG, "Could not read launch asset from manifest", e)
            }
            if (mAssets != null && mAssets.length() > 0) {
                for (i in 0 until mAssets.length()) {
                    try {
                        val assetObject = mAssets.getJSONObject(i)
                        assetList.add(AssetEntity(
                                assetObject.getString("key"),
                                assetObject.getString("contentType")
                        ).apply {
                            url = Uri.parse(assetObject.getString("url"))
                            embeddedAssetFilename = assetObject.optString("embeddedAssetFilename")
                        })
                    } catch (e: JSONException) {
                        Log.e(TAG, "Could not read asset from manifest", e)
                    }
                }
            }
            return assetList
        }
    override val isDevelopmentMode: Boolean
        get() = false

    companion object {
        private val TAG = Manifest::class.java.simpleName

        @Throws(JSONException::class)
        fun fromRawManifest(rawManifest: NewRawManifest, httpResponse: ManifestResponse?, configuration: UpdatesConfiguration): NewManifest {
            var actualRawManifest = rawManifest
            if (actualRawManifest.getRawJson().has("manifest")) {
                actualRawManifest = NewRawManifest(actualRawManifest.getRawJson().getJSONObject("manifest"))
            }
            val id = UUID.fromString(actualRawManifest.getID())
            val runtimeVersion = actualRawManifest.getRuntimeVersion()
            val launchAsset = actualRawManifest.getLaunchAsset()
            val assets = actualRawManifest.getAssets()
            val commitTime: Date = try {
                UpdatesUtils.parseDateString(actualRawManifest.getCreatedAt())
            } catch (e: ParseException) {
                Log.e(TAG, "Could not parse manifest createdAt string; falling back to current time", e)
                Date()
            }
            val serverDefinedHeaders = httpResponse?.header("expo-server-defined-headers")
            val manifestFilters = httpResponse?.header("expo-manifest-filters")
            return NewManifest(actualRawManifest, id, configuration.scopeKey, commitTime, runtimeVersion, launchAsset, assets, serverDefinedHeaders, manifestFilters)
        }

        internal fun headerDictionaryToJSONObject(headerDictionary: String?): JSONObject? {
            val jsonObject = JSONObject()
            val parser = Parser(headerDictionary)
            try {
                val filtersDictionary = parser.parseDictionary()
                val map = filtersDictionary.get()
                for (key in map.keys) {
                    val element = map[key]!!
                    // ignore any dictionary entries whose type is not string, number, or boolean
                    if (element is StringItem || element is BooleanItem || element is NumberItem<*>) {
                        jsonObject.put(key, element.get())
                    }
                }
            } catch (e: expo.modules.structuredheaders.ParseException) {
                Log.e(TAG, "Failed to parse manifest header content", e)
                return null
            } catch (e: JSONException) {
                Log.e(TAG, "Failed to parse manifest header content", e)
                return null
            }
            return jsonObject
        }
    }
}