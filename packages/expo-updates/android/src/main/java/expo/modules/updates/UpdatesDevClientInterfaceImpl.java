package expo.modules.updates;

import android.content.Context;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.Nullable;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicySingleUpdate;
import expo.modules.updates.loader.RemoteLoader;
import expo.modules.updates.manifest.Manifest;

public class UpdatesDevClientInterfaceImpl implements UpdatesDevClientInterface {
  @Override
  public List<UpdateEntity> getAvailableUpdates() {
    // TODO: should this get any embedded updates as well?
    // need to check on asset existence for all the assets -- maybe just check all assets in the DB
    return new ArrayList<>();
  }

  @Override
  public void fetchUpdateWithConfiguration(UpdatesConfiguration configuration, Context context, FetchCallback callback) {
    // TODO: what should this do if the update is already loaded?
    UpdatesController controller = UpdatesController.getInstance();
    UpdatesDatabase database = controller.getDatabase();
    RemoteLoader loader = new RemoteLoader(context, configuration, database, controller.getFileDownloader(), controller.getUpdatesDirectory());
    loader.start(new RemoteLoader.LoaderCallback() {
      @Override
      public void onFailure(Exception e) {
        callback.onFailure(e);
      }

      @Override
      public void onSuccess(@Nullable UpdateEntity update) {
        callback.onSuccess();
      }

      @Override
      public void onAssetLoaded(AssetEntity asset, int assetsLoaded, int totalAssets) {
        callback.onProgress(assetsLoaded, totalAssets);
      }

      @Override
      public boolean onManifestLoaded(Manifest manifest) {
        // TODO: should we actually check?
        return true;
      }
    });
  }

  @Override
  public void reload(Context context, ReloadCallback callback) {
    UpdatesController.getInstance().relaunchReactApplication(context, new Launcher.LauncherCallback() {
      @Override
      public void onFailure(Exception e) {
        callback.onFailure(e);
      }

      @Override
      public void onSuccess() {
        callback.onSuccess();
      }
    });
  }

  @Override
  public void setCurrentUpdate(UpdateEntity update) {
    UpdatesController.getInstance().setLaunchSelectionPolicy(new SelectionPolicySingleUpdate(update));
  }
}
