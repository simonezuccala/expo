package expo.modules.updates;

import android.content.Context;

import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

public interface UpdatesDevClientInterface {

  interface FetchCallback {
    void onFailure(Exception e);
    void onSuccess();
    void onProgress(int downloadedAssets, int totalAssets);
  }

  interface ReloadCallback {
    void onFailure(Exception e);
    void onSuccess();
  }

  List<UpdateEntity> getAvailableUpdates();
  void fetchUpdateWithConfiguration(UpdatesConfiguration configuration, Context context, FetchCallback callback);
  void reload(Context context, ReloadCallback callback);
  void setCurrentUpdate(UpdateEntity update);
}
