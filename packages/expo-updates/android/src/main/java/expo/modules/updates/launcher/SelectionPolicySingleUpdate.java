package expo.modules.updates.launcher;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import expo.modules.updates.db.entity.UpdateEntity;

/**
 * Trivial SelectionPolicy that will choose a single predetermined update to launch.
 *
 * Will ignore filters, runtime version, and any constraints besides the update ID.
 *
 * Always chooses to load new updates, and never chooses to delete any updates.
 */
public class SelectionPolicySingleUpdate implements SelectionPolicy {

  private UpdateEntity mUpdate;

  public SelectionPolicySingleUpdate(UpdateEntity update) {
    mUpdate = update;
  }

  @Override
  public UpdateEntity selectUpdateToLaunch(List<UpdateEntity> updates, JSONObject filters) {
    for (UpdateEntity update : updates) {
      if (update.id.equals(mUpdate.id)) {
        return update;
      }
    }
    return null;
  }

  @Override
  public List<UpdateEntity> selectUpdatesToDelete(List<UpdateEntity> updates, UpdateEntity launchedUpdate, JSONObject filters) {
    return new ArrayList<>();
  }

  @Override
  public boolean shouldLoadNewUpdate(UpdateEntity newUpdate, UpdateEntity launchedUpdate, JSONObject filters) {
    return true;
  }
}
