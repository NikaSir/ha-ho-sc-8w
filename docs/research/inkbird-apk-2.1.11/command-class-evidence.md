# INKBIRD 2.1.11 — IIC-800 command-class evidence

> Concise, line-numbered excerpts from selected JADX output. Complete decompiled classes are not committed.

## Class inventory

| requested class | lines | strong hits | structural hits | decompiled path |
|---|---:|---:|---:|---|
| `com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant` | 26 | 0 | 1 | `Iic800Constant/Iic800Constant.java` |
| `com.inkbird.inkbirdapp.device.iic800.model.IIic800Model` | 11 | 0 | 3 | `IIic800Model/IIic800Model.java` |
| `com.inkbird.inkbirdapp.device.iic800.model.Iic800Model` | 183 | 0 | 44 | `Iic800Model/Iic800Model.java` |
| `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter` | 398 | 15 | 88 | `Iic800Presenter/Iic800Presenter.java` |
| `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter` | 335 | 26 | 65 | `Iic800ManualPresenter/Iic800ManualPresenter.java` |
| `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter` | 315 | 33 | 61 | `Iic800SchedulePresenter/Iic800SchedulePresenter.java` |
| `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter` | 192 | 24 | 44 | `Iic800AddPlanPresenter/Iic800AddPlanPresenter.java` |
| `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter` | 220 | 10 | 8 | `Iic800SettingsPresenter/Iic800SettingsPresenter.java` |
| `com.inkbird.inkbirdapp.device.iic800.activity.fragment.Iic800ManualFragment` | 781 | 6 | 128 | `Iic800ManualFragment/Iic800ManualFragment.java` |
| `com.inkbird.inkbirdapp.device.iic800.activity.activity.Iic800AddPlanActivity` | 767 | 37 | 95 | `Iic800AddPlanActivity/Iic800AddPlanActivity.java` |
| `com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean` | 216 | 0 | 35 | `IicZoneBean/IicZoneBean.java` |
| `com.inkbird.inkbirdapp.device.iic800.bean.IrrigationBean` | 49 | 0 | 6 | `IrrigationBean/IrrigationBean.java` |
| `com.inkbird.inkbirdapp.device.iic800.bean.StartTimeBean` | 56 | 0 | 0 | `StartTimeBean/StartTimeBean.java` |

## `com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant`

Methods detected: `setHistoryBeans, getHistoryBeans`

### Excerpt 1: lines 1–26

Reasons: IIC-800 structural marker, compact protocol-facing class.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.utils;
00002: 
00003: import com.inkbird.inkbirdapp.R;
00004: import com.inkbird.inkbirdapp.device.iic800.bean.IicHistoryBean;
00005: import java.util.ArrayList;
00006: import java.util.List;
00007: 
00008: public class Iic800Constant {
00009:     private static List<IicHistoryBean> historyBeans = new ArrayList();
00010:     public static String devType = "IIC_800";
00011:     public static String IIC_400 = "IIC_400";
00012:     public static String IIC_600 = "IIC_600";
00013:     public static String IIC_800 = "IIC_800";
00014:     public static String IIC_801 = "IIC_801";
00015:     public static final int[] images = {R.mipmap.iic_zone1_default_ic, R.mipmap.iic_zone2_default_ic, R.mipmap.iic_zone3_default_ic, R.mipmap.iic_zone4_default_ic, R.mipmap.iic_zone5_default_ic, R.mipmap.iic_zone6_default_ic, R.mipmap.iic_zone7_default_ic, R.mipmap.iic_zone8_default_ic};
00016:     public static final int[] weeks = {R.string.normal_sunday, R.string.normal_monday, R.string.normal_tuesday, R.string.normal_wednesday, R.string.normal_thursday, R.string.normal_friday, R.string.normal_saturday};
00017: 
00018:     public static void setHistoryBeans(List<IicHistoryBean> list) {
00019:         historyBeans.clear();
00020:         historyBeans.addAll(list);
00021:     }
00022: 
00023:     public static List<IicHistoryBean> getHistoryBeans() {
00024:         return historyBeans;
00025:     }
00026: }
```


## `com.inkbird.inkbirdapp.device.iic800.model.IIic800Model`

Methods detected: `none/read failure`

### Excerpt 1: lines 1–11

Reasons: IIC-800 structural marker, compact protocol-facing class.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.model;
00002: 
00003: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00004: import com.thingclips.smart.sdk.bean.DeviceBean;
00005: import java.util.List;
00006: 
00007: public interface IIic800Model {
00008:     IicZoneBean parseZoneInfo(List<IicZoneBean> list, Object obj, DeviceBean deviceBean);
00009: 
00010:     void setNextTime(IicZoneBean iicZoneBean);
00011: }
```


## `com.inkbird.inkbirdapp.device.iic800.model.Iic800Model`

Methods detected: `onDestroy, Iic800Model, parseZoneInfo, if, while, if, if, if, if, if, setNextTime, if, if, getWeekNextTime, if, if, if, for, if, getOddEvenNextTime, if, while, if, for, if, getIntervalsNextTime, if, while, if, for, if`

### Excerpt 1: lines 1–44

Reasons: IIC-800 structural marker.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.model;
00002: 
00003: import android.content.Context;
00004: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00005: import com.inkbird.inkbirdapp.device.iic800.bean.StartTimeBean;
00006: import com.thingclips.smart.android.common.utils.SafeHandler;
00007: import com.thingclips.smart.android.mvp.model.BaseModel;
00008: import com.thingclips.smart.sdk.bean.DeviceBean;
00009: import java.util.ArrayList;
00010: import java.util.Calendar;
00011: import java.util.Date;
00012: import java.util.List;
00013: 
00014: public class Iic800Model extends BaseModel implements IIic800Model {
00015:     @Override
00016:     public void onDestroy() {
00017:     }
00018: 
00019:     public Iic800Model(Context context, SafeHandler safeHandler) {
00020:         super(context, safeHandler);
00021:     }
00022: 
00023:     @Override
00024:     public IicZoneBean parseZoneInfo(List<IicZoneBean> list, Object obj, DeviceBean deviceBean) {
00025:         String string = obj.toString();
00026:         IicZoneBean iicZoneBean = new IicZoneBean(Integer.parseInt(string.substring(0, 2)));
00027:         if (string.length() != 40 || !list.contains(iicZoneBean)) {
00028:             return iicZoneBean;
00029:         }
00030:         int iIndexOf = list.indexOf(iicZoneBean);
00031:         IicZoneBean iicZoneBean2 = list.get(iIndexOf);
00032:         int iIntValue = Integer.valueOf(string.substring(2, 4), 16).intValue();
00033:         iicZoneBean2.setRunTime(iIntValue);
00034:         ArrayList arrayList = new ArrayList();
00035:         String strSubstring = string.substring(4, 16);
00036:         String strSubstring2 = string.substring(16, 28);
00037:         int i2 = 0;
00038:         while (i2 < 6) {
00039:             int i3 = i2 * 2;
00040:             i2++;
00041:             int i4 = i2 * 2;
00042:             String strSubstring3 = strSubstring.substring(i3, i4);
00043:             String strSubstring4 = strSubstring2.substring(i3, i4);
00044:             if (!strSubstring3.equals("FF") || !strSubstring4.equals("FF")) {
```

### Excerpt 2: lines 48–108

Reasons: IIC-800 structural marker.

```java
00048:                 }
00049:                 if (!strSubstring4.equals("FF")) {
00050:                     startTimeBean.setMinute(Integer.valueOf(strSubstring4, 16).intValue());
00051:                 }
00052:                 arrayList.add(startTimeBean);
00053:             }
00054:         }
00055:         iicZoneBean2.setStartTimeList(arrayList);
00056:         iicZoneBean2.setScheduleMode(Integer.valueOf(string.substring(28, 30), 16).intValue());
00057:         iicZoneBean2.setScheduleDay(Integer.valueOf(string.substring(30, 32), 16).intValue());
00058:         iicZoneBean2.setIntervalYear(Integer.valueOf(string.substring(32, 34), 16).intValue());
00059:         iicZoneBean2.setIntervalMonth(Integer.valueOf(string.substring(34, 36), 16).intValue());
00060:         iicZoneBean2.setIntervalDay(Integer.valueOf(string.substring(36, 38), 16).intValue());
00061:         iicZoneBean2.setEnable(Integer.valueOf(string.substring(38, 39), 16).intValue() != 0);
00062:         iicZoneBean2.setSeaAdjSwitch(Integer.valueOf(string.substring(39, 40), 16).intValue() != 0);
00063:         if (iIntValue != 0 && arrayList.size() != 0) {
00064:             setNextTime(iicZoneBean2);
00065:         }
00066:         if (deviceBean != null) {
00067:             Object obj2 = deviceBean.getDps().get("101");
00068:             iicZoneBean2.setWorkMode(obj2 != null ? obj2.toString() : "OFF");
00069:             Object obj3 = deviceBean.getDps().get("102");
00070:             iicZoneBean2.setTotalSeaSwitch(obj3 != null && ((Boolean) obj3).booleanValue());
00071:             Object obj4 = deviceBean.getDps().get("103");
00072:             iicZoneBean2.setAdjustValue(obj4 != null ? ((Integer) obj4).intValue() : 0);
00073:             Object obj5 = deviceBean.getDps().get("106");
00074:             iicZoneBean2.setAlarm(obj5 != null && ((Boolean) obj5).booleanValue());
00075:             iicZoneBean2.setWait((((Integer) deviceBean.getDps().get("108")).intValue() >> iIndexOf) % 2 != 0);
00076:         }
00077:         return iicZoneBean2;
00078:     }
00079: 
00080:     @Override
00081:     public void setNextTime(IicZoneBean iicZoneBean) {
00082:         if (iicZoneBean.getScheduleMode() == 0) {
00083:             iicZoneBean.setNextTime(getWeekNextTime(iicZoneBean.getScheduleDay(), iicZoneBean.getStartTimeList()));
00084:             return;
00085:         }
00086:         if (iicZoneBean.getScheduleMode() == 1) {
00087:             iicZoneBean.setNextTime(getOddEvenNextTime(true, iicZoneBean.getStartTimeList()));
00088:         } else if (iicZoneBean.getScheduleMode() == 2) {
00089:             iicZoneBean.setNextTime(getOddEvenNextTime(false, iicZoneBean.getStartTimeList()));
00090:         } else if (iicZoneBean.getScheduleMode() == 3) {
00091:             iicZoneBean.setNextTime(getIntervalsNextTime(iicZoneBean));
00092:         }
00093:     }
00094: 
00095:     private long getWeekNextTime(int i2, List<StartTimeBean> list) {
00096:         long time = new Date().getTime();
00097:         int i3 = Calendar.getInstance().get(7);
00098:         long j2 = Long.MAX_VALUE;
00099:         for (int i4 = 0; i4 <= 7; i4++) {
00100:             if ((i2 >> i4) % 2 != 0 || i4 == 7) {
00101:                 int i5 = (i4 + 1) - i3;
00102:                 if (i5 < 0) {
00103:                     i5 += 7;
00104:                 }
00105:                 if (i4 == 7) {
00106:                     i5 = 7;
00107:                 }
00108:                 Date date = new Date();
```

### Excerpt 3: lines 144–177

Reasons: IIC-800 structural marker.

```java
00144:                 }
00145:                 i2++;
00146:             }
00147:         }
00148:         return j2;
00149:     }
00150: 
00151:     private long getIntervalsNextTime(IicZoneBean iicZoneBean) {
00152:         Date date = new Date();
00153:         long time = date.getTime();
00154:         date.setYear(iicZoneBean.getIntervalYear() + 100);
00155:         date.setMonth(iicZoneBean.getIntervalMonth() - 1);
00156:         date.setDate(iicZoneBean.getIntervalDay());
00157:         int time2 = (int) (((time / 1000) - (date.getTime() / 1000)) / 86400);
00158:         long j2 = Long.MAX_VALUE;
00159:         if (iicZoneBean.getStartTimeList() != null && iicZoneBean.getStartTimeList().size() > 0 && iicZoneBean.getScheduleDay() > 0) {
00160:             boolean z = false;
00161:             int i2 = 0;
00162:             while (!z) {
00163:                 Date date2 = new Date();
00164:                 date2.setDate(date2.getDate() + i2);
00165:                 if (time2 >= 0 && time2 % iicZoneBean.getScheduleDay() == 0) {
00166:                     for (StartTimeBean startTimeBean : iicZoneBean.getStartTimeList()) {
00167:                         date2.setHours(startTimeBean.getHour());
00168:                         date2.setMinutes(startTimeBean.getMinute());
00169:                         date2.setSeconds(0);
00170:                         long time3 = date2.getTime();
00171:                         if (time3 > time && time3 < j2) {
00172:                             z = true;
00173:                             j2 = time3;
00174:                         }
00175:                     }
00176:                 }
00177:                 time2++;
```


## `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter`

Methods detected: `run, if, run, if, onSuccess, onError, onNetworkStatusChanged, Iic800Presenter, initData, if, if, if, if, if, if, while, onDestroy, if, goMore, getWeatherData, if, onSuccess, if, onSuccess, onFailure, onFailure, initNormalTime, getWateringTime, updateNextTime, for, if, if, clearAlarm, onEvent, onDpUpdate, if, if, if, while, if, for, if, if, for, if, if, for, if, for, if, for, if, if, if, while, if, if, while, if, for, if, if, if, while, if, if, onRemoved, if, onStatusChanged, if, onDevInfoUpdate, if`

### Excerpt 1: lines 1–69

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.presenter;
00002: 
00003: import android.app.Activity;
00004: import android.content.Intent;
00005: import android.util.Log;
00006: import android.widget.Toast;
00007: import com.alibaba.fastjson.JSON;
00008: import com.alibaba.fastjson.JSONObject;
00009: import com.inkbird.base.common.wifi.DeviceUtils;
00010: import com.inkbird.base.utils.StringUtils;
00011: import com.inkbird.inkbirdapp.R;
00012: import com.inkbird.inkbirdapp.device.iic800.activity.activity.DeviceUpdateActivity;
00013: import com.inkbird.inkbirdapp.device.iic800.activity.activity.Iic800SettingsActivity;
00014: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00015: import com.inkbird.inkbirdapp.device.iic800.model.Iic800Model;
00016: import com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant;
00017: import com.inkbird.inkbirdapp.device.iic800.view.IIic800View;
00018: import com.thingclips.sdk.eventbus.EventBus;
00019: import com.thingclips.smart.android.mvp.presenter.BasePresenter;
00020: import com.thingclips.smart.android.user.bean.User;
00021: import com.thingclips.smart.home.sdk.ThingHomeSdk;
00022: import com.thingclips.smart.home.sdk.bean.DashBoardBean;
00023: import com.thingclips.smart.home.sdk.bean.HomeBean;
00024: import com.thingclips.smart.home.sdk.bean.WeatherBean;
00025: import com.thingclips.smart.home.sdk.callback.IGetHomeWetherCallBack;
00026: import com.thingclips.smart.home.sdk.callback.IIGetHomeWetherSketchCallBack;
00027: import com.thingclips.smart.sdk.api.IDevListener;
00028: import com.thingclips.smart.sdk.api.IResultCallback;
00029: import com.thingclips.smart.sdk.api.IThingDevice;
00030: import com.thingclips.smart.sdk.bean.DeviceBean;
00031: import com.thingclips.smart.uispecs.component.ProgressUtils;
00032: import java.util.ArrayList;
00033: import java.util.HashMap;
00034: import java.util.Iterator;
00035: import java.util.List;
00036: import java.util.Map;
00037: 
00038: public class Iic800Presenter extends BasePresenter implements IDevListener {
00039:     private String devId;
00040:     private Activity mContext;
00041:     private IThingDevice mDevice;
00042:     private Iic800Model mModel;
00043:     private IIic800View mView;
00044:     private int zoneNum;
00045:     private List<IicZoneBean> zoneBeans = new ArrayList();
00046:     private boolean isOta = false;
00047:     private Runnable getManualTime = new Runnable() {
00048:         @Override
00049:         public void run() {
00050:             if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00051:                 DeviceUtils.sendCommand("45", "000000000000000000000000000000000000", Iic800Presenter.this.mDevice);
00052:             } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00053:                 DeviceUtils.sendCommand("45", "0000000000000000000000000000000000000000000000000000", Iic800Presenter.this.mDevice);
00054:             } else {
00055:                 DeviceUtils.sendCommand("45", "00000000000000000000000000000000000000000000000000000000000000000000", Iic800Presenter.this.mDevice);
00056:             }
00057:             Iic800Presenter.this.mContext.runOnUiThread(new Runnable() {
00058:                 @Override
00059:                 public void run() {
00060:                     if (Iic800Constant.devType.equals(Iic800Constant.IIC_800) || !Iic800Presenter.this.isOta) {
00061:                         return;
00062:                     }
00063:                     Intent intent = new Intent(Iic800Presenter.this.mContext, (Class<?>) DeviceUpdateActivity.class);
00064:                     intent.putExtra("devId", Iic800Presenter.this.devId);
00065:                     Iic800Presenter.this.mContext.startActivity(intent);
00066:                 }
00067:             });
00068:         }
00069:     };
```

### Excerpt 2: lines 89–187

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00089:         this.mContext = activity;
00090:         this.mView = iIic800View;
00091:         this.mModel = new Iic800Model(activity, this.mHandler);
00092:         initData();
00093:     }
00094: 
00095:     private void initData() {
00096:         this.devId = this.mContext.getIntent().getStringExtra("devId");
00097:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00098:         if (deviceBean != null && (deviceBean.getProductId().equals("x7hkmeis8yqj6ntj") || deviceBean.getProductId().equals("2zz0gjpp3jybn1e2"))) {
00099:             Iic800Constant.devType = Iic800Constant.IIC_400;
00100:         } else if (deviceBean != null && (deviceBean.getProductId().equals("ln52teq4wpifvfcl") || deviceBean.getProductId().equals("50ag1pubogze9rpf"))) {
00101:             Iic800Constant.devType = Iic800Constant.IIC_600;
00102:         } else if (deviceBean != null && (deviceBean.getProductId().equals("fzom7up0skanjmxs") || deviceBean.getProductId().equals("ce2iiozalmxavjdj"))) {
00103:             Iic800Constant.devType = Iic800Constant.IIC_801;
00104:         } else {
00105:             Iic800Constant.devType = Iic800Constant.IIC_800;
00106:         }
00107:         IThingDevice iThingDeviceNewDeviceInstance = ThingHomeSdk.newDeviceInstance(this.devId);
00108:         this.mDevice = iThingDeviceNewDeviceInstance;
00109:         if (iThingDeviceNewDeviceInstance != null) {
00110:             iThingDeviceNewDeviceInstance.registerDevListener(this);
00111:         }
00112:         int i2 = 0;
00113:         if (deviceBean != null) {
00114:             this.mView.setDeviceName(deviceBean.getName());
00115:             this.mView.setOnlineState(deviceBean.getIsOnline());
00116:             Map<String, Object> dps = deviceBean.getDps();
00117:             if (dps != null && dps.get("110") != null) {
00118:                 Object obj = dps.get("110");
00119:                 if (obj instanceof Boolean) {
00120:                     this.isOta = ((Boolean) obj).booleanValue();
00121:                 } else if (obj instanceof Integer) {
00122:                     this.isOta = ((Integer) obj).intValue() == 15570;
00123:                 }
00124:             }
00125:         }
00126:         if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00127:             this.zoneNum = 4;
00128:         } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00129:             this.zoneNum = 6;
00130:         } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_801)) {
00131:             this.zoneNum = 8;
00132:         } else {
00133:             this.zoneNum = 8;
00134:         }
00135:         this.zoneBeans.clear();
00136:         while (i2 < this.zoneNum) {
00137:             i2++;
00138:             this.zoneBeans.add(new IicZoneBean(i2));
00139:         }
00140:         initNormalTime();
00141:         EventBus.getDefault().register(this);
00142:         getWeatherData();
00143:     }
00144: 
00145:     @Override
00146:     public void onDestroy() {
00147:         super.onDestroy();
00148:         EventBus.getDefault().unregister(this);
00149:         IThingDevice iThingDevice = this.mDevice;
00150:         if (iThingDevice != null) {
00151:             iThingDevice.unRegisterDevListener();
00152:         }
00153:     }
00154: 
00155:     public void goMore() {
00156:         Intent intent = new Intent(this.mContext, (Class<?>) Iic800SettingsActivity.class);
00157:         intent.putExtra("devId", this.devId);
00158:         this.mContext.startActivity(intent);
00159:     }
00160: 
00161:     private void getWeatherData() {
00162:         HomeBean homeBean;
00163:         Activity activity = this.mContext;
00164:         final long j2 = activity.getSharedPreferences(activity.getPackageName(), 0).getLong("homeId", 0L);
00165:         if (j2 == 0 || (homeBean = ThingHomeSdk.getDataInstance().getHomeBean(j2)) == null) {
00166:             return;
00167:         }
00168:         ThingHomeSdk.newHomeInstance(j2).getHomeWeatherSketch(homeBean.getLon(), homeBean.getLat(), new IIGetHomeWetherSketchCallBack() {
00169:             @Override
00170:             public void onSuccess(final WeatherBean weatherBean) {
00171:                 User user = ThingHomeSdk.getUserInstance().getUser();
00172:                 HashMap map = new HashMap();
00173:                 if (user != null) {
00174:                     map.put("tempUnit", Integer.valueOf(user.getTempUnit()));
00175:                 } else {
00176:                     map.put("tempUnit", 1);
00177:                 }
00178:                 ThingHomeSdk.newHomeInstance(j2).getHomeWeatherDetail(10, map, new IGetHomeWetherCallBack() {
00179:                     @Override
00180:                     public void onSuccess(List<DashBoardBean> list) {
00181:                         Iic800Presenter.this.mView.setWeatherDetail(weatherBean, list);
00182:                     }
00183: 
00184:                     @Override
00185:                     public void onFailure(String str, String str2) {
00186:                         Iic800Presenter.this.mView.setWeatherDetail(null, null);
00187:                     }
```

### Excerpt 3: lines 192–356

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00192:             public void onFailure(String str, String str2) {
00193:                 Iic800Presenter.this.mView.setWeatherDetail(null, null);
00194:             }
00195:         });
00196:     }
00197: 
00198:     private void initNormalTime() {
00199:         DeviceUtils.sendCommand("38", "0000000000000000000000000000000000000000", this.mDevice);
00200:     }
00201: 
00202:     public void getWateringTime() {
00203:         this.mHandler.postDelayed(this.getManualTime, 400L);
00204:     }
00205: 
00206:     private void updateNextTime() {
00207:         boolean z;
00208:         int remainTime;
00209:         boolean z2;
00210:         int zoneId = 0;
00211:         boolean z3 = false;
00212:         boolean z4 = false;
00213:         long nextTime = 0;
00214:         for (IicZoneBean iicZoneBean : this.zoneBeans) {
00215:             z4 = !"OFF".equals(iicZoneBean.getWorkMode());
00216:             boolean zIsAlarm = iicZoneBean.isAlarm();
00217:             if (iicZoneBean.isWateringSwitch()) {
00218:                 zoneId = iicZoneBean.getZoneId();
00219:                 nextTime = 10;
00220:                 remainTime = iicZoneBean.getRemainTime();
00221:                 z = true;
00222:                 z2 = zIsAlarm;
00223:                 this.mView.setNextTimeInfo(this.devId, zoneId, nextTime, z, z4, remainTime, z2);
00224:             }
00225:             if (iicZoneBean.getRunTime() != 0 && iicZoneBean.getStartTimeList().size() != 0 && iicZoneBean.isEnable() && (nextTime == 0 || nextTime / 1000 > iicZoneBean.getNextTime() / 1000)) {
00226:                 zoneId = iicZoneBean.getZoneId();
00227:                 nextTime = iicZoneBean.getNextTime();
00228:             }
00229:             z3 = zIsAlarm;
00230:         }
00231:         z = false;
00232:         remainTime = 0;
00233:         z2 = z3;
00234:         this.mView.setNextTimeInfo(this.devId, zoneId, nextTime, z, z4, remainTime, z2);
00235:     }
00236: 
00237:     public void clearAlarm() {
00238:         ProgressUtils.showLoadingViewFullPage(this.mContext);
00239:         DeviceUtils.sendCommand("109", true, this.mDevice, this.resultCallback);
00240:     }
00241: 
00242:     public void onEvent(IicZoneBean iicZoneBean) {
00243:         updateNextTime();
00244:     }
00245: 
00246:     @Override
00247:     public void onDpUpdate(String str, String str2) {
00248:         Object obj;
00249:         Object obj2;
00250:         Log.i("mytag", str2);
00251:         if (str.equals(this.devId)) {
00252:             DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(str);
00253:             JSONObject object = JSON.parseObject(str2);
00254:             if (object.containsKey("38") && (obj2 = object.get("38")) != null && !"0000000000000000000000000000000000000000".equals(obj2.toString())) {
00255:                 IicZoneBean zoneInfo = this.mModel.parseZoneInfo(this.zoneBeans, obj2, deviceBean);
00256:                 if (zoneInfo.getZoneId() == this.zoneBeans.size()) {
00257:                     this.mView.deviceAlarm(zoneInfo.isAlarm());
00258:                     Iterator<IicZoneBean> it = this.zoneBeans.iterator();
00259:                     while (it.hasNext()) {
00260:                         EventBus.getDefault().post(it.next());
00261:                     }
00262:                 }
00263:             }
00264:             if (object.containsKey("45")) {
00265:                 Object obj3 = object.get("45");
00266:                 String string = obj3 != null ? obj3.toString() : "00000000000000000000000000000000000000000000000000000000000000000000";
00267:                 int iIntValue = Integer.valueOf(string.substring(2, 4), 16).intValue();
00268:                 String strSubstring = string.substring(4);
00269:                 for (IicZoneBean iicZoneBean : this.zoneBeans) {
00270:                     iicZoneBean.setManualMode(iIntValue);
00271:                     iicZoneBean.setRemainTime(Integer.valueOf(strSubstring.substring((iicZoneBean.getZoneId() - 1) * 4, iicZoneBean.getZoneId() * 4), 16).intValue());
00272:                     if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00273:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 16, (iicZoneBean.getZoneId() * 4) + 16), 16).intValue());
00274:                     } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00275:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 24, (iicZoneBean.getZoneId() * 4) + 24), 16).intValue());
00276:                     } else {
00277:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 32, (iicZoneBean.getZoneId() * 4) + 32), 16).intValue());
00278:                     }
00279:                     EventBus.getDefault().post(iicZoneBean);
00280:                 }
00281:             }
00282:             if (object.containsKey("101")) {
00283:                 Object obj4 = object.get("101");
00284:                 String string2 = obj4 != null ? obj4.toString() : "OFF";
00285:                 for (IicZoneBean iicZoneBean2 : this.zoneBeans) {
00286:                     iicZoneBean2.setWorkMode(string2);
00287:                     if ("Auto".equals(string2) || "OFF".equals(string2)) {
00288:                         iicZoneBean2.setManualTime(0);
00289:                     }
00290:                 }
00291:                 updateNextTime();
00292:             }
00293:             if (object.containsKey("102")) {
00294:                 Object obj5 = object.get("102");
00295:                 boolean z = obj5 != null && ((Boolean) obj5).booleanValue();
00296:                 for (IicZoneBean iicZoneBean3 : this.zoneBeans) {
00297:                     iicZoneBean3.setTotalSeaSwitch(z);
00298:                     EventBus.getDefault().post(iicZoneBean3);
00299:                 }
00300:             }
00301:             if (object.containsKey("103")) {
00302:                 Object obj6 = object.get("103");
00303:                 int iIntValue2 = obj6 != null ? ((Integer) obj6).intValue() : 0;
00304:                 for (IicZoneBean iicZoneBean4 : this.zoneBeans) {
00305:                     iicZoneBean4.setAdjustValue(iIntValue2);
00306:                     EventBus.getDefault().post(iicZoneBean4);
00307:                 }
00308:             }
00309:             if (object.containsKey("104")) {
00310:                 Object obj7 = object.get("104");
00311:                 String strIntToHex = StringUtils.intToHex(obj7 != null ? ((Integer) obj7).intValue() : 0, 8);
00312:                 boolean zEquals = "1".equals(strIntToHex.substring(1, 2));
00313:                 int i2 = Integer.parseInt(strIntToHex.substring(2, 3), 16);
00314:                 int i3 = Integer.parseInt(strIntToHex.substring(3, 4), 16);
00315:                 for (IicZoneBean iicZoneBean5 : this.zoneBeans) {
00316:                     if (iicZoneBean5.getZoneId() == i3) {
00317:                         iicZoneBean5.setWateringSwitch(zEquals);
00318:                         if (zEquals && "Auto".equals(iicZoneBean5.getWorkMode())) {
00319:                             this.mModel.setNextTime(iicZoneBean5);
00320:                         }
00321:                     }
00322:                 }
00323:                 if (i3 == this.zoneNum || i2 != 0) {
00324:                     Iterator<IicZoneBean> it2 = this.zoneBeans.iterator();
00325:                     while (it2.hasNext()) {
00326:                         EventBus.getDefault().post(it2.next());
00327:                     }
00328:                     if (deviceBean != null) {
00329:                         Object obj8 = deviceBean.getDps().get("101");
00330:                         this.mView.setCurrentFragment(obj8 != null ? obj8.toString() : "OFF");
00331:                     }
00332:                 }
00333:             }
00334:             if (object.containsKey("106")) {
00335:                 Object obj9 = object.get("106");
00336:                 boolean z2 = obj9 != null && ((Boolean) obj9).booleanValue();
00337:                 Iterator<IicZoneBean> it3 = this.zoneBeans.iterator();
00338:                 while (it3.hasNext()) {
00339:                     it3.next().setAlarm(z2);
00340:                 }
00341:                 this.mView.deviceAlarm(z2);
00342:             }
00343:             if (object.containsKey("107")) {
00344:                 for (IicZoneBean iicZoneBean6 : this.zoneBeans) {
00345:                     if ("Auto".equals(iicZoneBean6.getWorkMode())) {
00346:                         this.mModel.setNextTime(iicZoneBean6);
00347:                     }
00348:                 }
00349:                 updateNextTime();
00350:             }
00351:             if (object.containsKey("108")) {
00352:                 int iIntValue3 = ((Integer) object.get("108")).intValue();
00353:                 for (int i4 = 0; i4 < this.zoneNum; i4++) {
00354:                     if ((iIntValue3 >> i4) % 2 == 0) {
00355:                         this.zoneBeans.get(i4).setWait(false);
00356:                     } else {
```


## `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter`

Methods detected: `onSuccess, onError, Iic800ManualPresenter, onDestroy, if, setBackground, openAlbum, openCamera, if, deleteBg, if, if, stopManual, if, for, if, if, stopAllManual, if, if, startManuals, if, if, for, startManuals2, if, while, if, if, changeManuals, if, for, startAllManual, if, changeAllManual, if, for, if, onActivityResult, if, if, if, if, handleMessage, if, CutForPhoto, if, if, if, startCrop, if, getPowerStatus, if`

### Excerpt 1: lines 11–288

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00011: import android.widget.Toast;
00012: import androidx.fragment.app.Fragment;
00013: import com.inkbird.base.common.wifi.DeviceUtils;
00014: import com.inkbird.base.utils.ActivityManager;
00015: import com.inkbird.base.utils.DisplayUtil;
00016: import com.inkbird.base.utils.PhotoUtils;
00017: import com.inkbird.base.utils.StringUtils;
00018: import com.inkbird.base.utils.file.FileProviderCompat;
00019: import com.inkbird.base.utils.file.FileUtils;
00020: import com.inkbird.inkbirdapp.R;
00021: import com.inkbird.inkbirdapp.base.widget.popwindow.PopWindowUtil;
00022: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00023: import com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant;
00024: import com.inkbird.inkbirdapp.device.iic800.view.Iic800ManualView;
00025: import com.thingclips.smart.android.mvp.presenter.BasePresenter;
00026: import com.thingclips.smart.home.sdk.ThingHomeSdk;
00027: import com.thingclips.smart.multimedia.crop.CropExtras;
00028: import com.thingclips.smart.sdk.api.IResultCallback;
00029: import com.thingclips.smart.sdk.api.IThingDevice;
00030: import com.thingclips.smart.sdk.bean.DeviceBean;
00031: import com.thingclips.smart.uispecs.component.ProgressUtils;
00032: import com.yalantis.ucrop.UCrop;
00033: import java.io.File;
00034: import java.io.IOException;
00035: import java.text.SimpleDateFormat;
00036: import java.util.Date;
00037: import java.util.Iterator;
00038: import java.util.List;
00039: 
00040: public class Iic800ManualPresenter extends BasePresenter {
00041:     private static final int OPERATION_FAILED = 2;
00042:     private static final int OPERATION_SUCCESSFUL = 1;
00043:     private String devId;
00044:     private Uri imageUri;
00045:     private Fragment mContext;
00046:     private IThingDevice mDevice;
00047:     private Iic800ManualView mView;
00048:     private final IResultCallback resultCallback = new IResultCallback() {
00049:         @Override
00050:         public void onSuccess() {
00051:             Iic800ManualPresenter.this.mHandler.sendEmptyMessage(1);
00052:         }
00053: 
00054:         @Override
00055:         public void onError(String str, String str2) {
00056:             Iic800ManualPresenter.this.mHandler.sendEmptyMessage(2);
00057:         }
00058:     };
00059:     private int zoneId;
00060: 
00061:     public Iic800ManualPresenter(Fragment fragment, Iic800ManualView iic800ManualView) {
00062:         this.mContext = fragment;
00063:         this.mView = iic800ManualView;
00064:         String stringExtra = fragment.getActivity().getIntent().getStringExtra("devId");
00065:         this.devId = stringExtra;
00066:         this.mDevice = ThingHomeSdk.newDeviceInstance(stringExtra);
00067:     }
00068: 
00069:     @Override
00070:     public void onDestroy() {
00071:         super.onDestroy();
00072:         IThingDevice iThingDevice = this.mDevice;
00073:         if (iThingDevice != null) {
00074:             iThingDevice.onDestroy();
00075:         }
00076:     }
00077: 
00078:     public void setBackground(int i2) {
00079:         this.zoneId = i2;
00080:     }
00081: 
00082:     public void openAlbum() {
00083:         this.mContext.startActivityForResult(PhotoUtils.getAlbumIntent(), 1);
00084:     }
00085: 
00086:     public void openCamera() {
00087:         File file = new File(new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image")), "inkbird" + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date(System.currentTimeMillis())) + ".png");
00088:         String path = file.getPath();
00089:         File file2 = new File(path.substring(0, path.lastIndexOf(File.separator)));
00090:         if (!file2.exists()) {
00091:             file2.mkdirs();
00092:         }
00093:         Intent intent = new Intent("android.media.action.IMAGE_CAPTURE");
00094:         Uri uriForFile = FileProviderCompat.getUriForFile(this.mContext.getContext(), file);
00095:         this.imageUri = uriForFile;
00096:         intent.putExtra("output", uriForFile);
00097:         this.mContext.startActivityForResult(intent, 19);
00098:     }
00099: 
00100:     public void deleteBg() {
00101:         try {
00102:             File file = new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image"));
00103:             File file2 = new File(Environment.getExternalStoragePublicDirectory("Pictures").getPath());
00104:             File file3 = new File(file, this.devId + this.zoneId + ".png");
00105:             File file4 = new File(file2, this.devId + this.zoneId + ".png");
00106:             if (file3.exists()) {
00107:                 file3.delete();
00108:             }
00109:             if (file4.exists()) {
00110:                 file4.delete();
00111:             }
00112:         } catch (Exception e2) {
00113:             e2.printStackTrace();
00114:         }
00115:         this.mView.updateItem(this.zoneId);
00116:     }
00117: 
00118:     public void stopManual(List<IicZoneBean> list) {
00119:         if (this.mDevice != null) {
00120:             StringBuilder sb = new StringBuilder();
00121:             StringBuilder sb2 = new StringBuilder();
00122:             boolean z = false;
00123:             int i2 = 0;
00124:             for (IicZoneBean iicZoneBean : list) {
00125:                 int manualMode = iicZoneBean.getManualMode();
00126:                 if (iicZoneBean.isWateringSwitch()) {
00127:                     sb.append(StringUtils.intToHex(0, 4));
00128:                     sb2.append(StringUtils.intToHex(0, 4));
00129:                     z = true;
00130:                 } else {
00131:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00132:                     sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00133:                 }
00134:                 i2 = manualMode;
00135:             }
00136:             if (z) {
00137:                 ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00138:                 DeviceUtils.sendCommand("45", "01" + StringUtils.intToHex(i2, 2) + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00139:             }
00140:         }
00141:     }
00142: 
00143:     public void stopAllManual() {
00144:         if (this.mDevice != null) {
00145:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00146:             if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00147:                 DeviceUtils.sendCommand("45", "010000000000000000000000000000000000", this.mDevice, this.resultCallback);
00148:             } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00149:                 DeviceUtils.sendCommand("45", "0100000000000000000000000000000000000000000000000000", this.mDevice, this.resultCallback);
00150:             } else {
00151:                 DeviceUtils.sendCommand("45", "01000000000000000000000000000000000000000000000000000000000000000000", this.mDevice, this.resultCallback);
00152:             }
00153:         }
00154:     }
00155: 
00156:     public void startManuals(List<IicZoneBean> list) {
00157:         if (this.mDevice != null) {
00158:             if (!getPowerStatus()) {
00159:                 PopWindowUtil.getInstance().showTips(ActivityManager.getAppManager().currentActivity(), this.mContext.getString(R.string.normal_tip), this.mContext.getString(R.string.msg_power_switch));
00160:                 return;
00161:             }
00162:             StringBuilder sb = new StringBuilder();
00163:             StringBuilder sb2 = new StringBuilder();
00164:             for (IicZoneBean iicZoneBean : list) {
00165:                 sb.append(StringUtils.intToHex(iicZoneBean.getManualTime(), 4));
00166:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00167:             }
00168:             ProgressUtils.showLoadingViewFullPage(this.mContext.requireContext());
00169:             DeviceUtils.sendCommand("45", "0101" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00170:             Log.i("45dp:", "-------0101" + ((Object) sb) + ((Object) sb2));
00171:         }
00172:     }
00173: 
00174:     public void startManuals2(List<IicZoneBean> list) {
00175:         if (this.mDevice != null) {
00176:             StringBuilder sb = new StringBuilder();
00177:             StringBuilder sb2 = new StringBuilder();
00178:             for (int i2 = 1; i2 < 9; i2++) {
00179:                 Iterator<IicZoneBean> it = list.iterator();
00180:                 while (true) {
00181:                     if (it.hasNext()) {
00182:                         IicZoneBean next = it.next();
00183:                         if (next.getZoneId() == i2) {
00184:                             sb.append(StringUtils.intToHex(next.getManualTime(), 4));
00185:                             sb2.append(StringUtils.intToHex(next.getWateredTime(), 4));
00186:                             break;
00187:                         }
00188:                     } else {
00189:                         sb.append(StringUtils.intToHex(0, 4));
00190:                         sb2.append(StringUtils.intToHex(0, 4));
00191:                         break;
00192:                     }
00193:                 }
00194:             }
00195:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00196:             DeviceUtils.sendCommand("45", "0101" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00197:         }
00198:     }
00199: 
00200:     public void changeManuals(List<IicZoneBean> list) {
00201:         if (this.mDevice != null) {
00202:             StringBuilder sb = new StringBuilder();
00203:             StringBuilder sb2 = new StringBuilder();
00204:             for (IicZoneBean iicZoneBean : list) {
00205:                 sb.append(StringUtils.intToHex(iicZoneBean.getManualTime(), 4));
00206:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00207:             }
00208:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00209:             DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00210:         }
00211:     }
00212: 
00213:     public void startAllManual(int i2) {
00214:         if (this.mDevice == null || i2 <= 0) {
00215:             return;
00216:         }
00217:         StringBuilder sb = new StringBuilder();
00218:         StringBuilder sb2 = new StringBuilder();
00219:         for (int i3 = 0; i3 < 8; i3++) {
00220:             sb.append(StringUtils.intToHex(i2, 4));
00221:             sb2.append(StringUtils.intToHex(0, 4));
00222:         }
00223:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00224:         DeviceUtils.sendCommand("45", "0100" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00225:     }
00226: 
00227:     public void changeAllManual(List<IicZoneBean> list, int i2) {
00228:         if (this.mDevice != null) {
00229:             StringBuilder sb = new StringBuilder();
00230:             StringBuilder sb2 = new StringBuilder();
00231:             for (IicZoneBean iicZoneBean : list) {
00232:                 if (iicZoneBean.isWateringSwitch()) {
00233:                     sb.append(StringUtils.intToHex(i2, 4));
00234:                 } else {
00235:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00236:                 }
00237:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00238:             }
00239:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00240:             DeviceUtils.sendCommand("45", "0200" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00241:         }
00242:     }
00243: 
00244:     public void onActivityResult(int i2, int i3, Intent intent) {
00245:         if (i3 == -1) {
00246:             if (i2 == 1) {
00247:                 if (intent != null) {
00248:                     startCrop(intent.getData());
00249:                 }
00250:             } else if (i2 == 19) {
00251:                 startCrop(this.imageUri);
00252:             } else {
00253:                 if (i2 != 69) {
00254:                     return;
00255:                 }
00256:                 this.mView.updateItem(this.zoneId);
00257:             }
00258:         }
00259:     }
00260: 
00261:     @Override
00262:     public boolean handleMessage(Message message) {
00263:         int i2 = message.what;
00264:         if (i2 == 1) {
00265:             ProgressUtils.hideLoadingViewFullPage();
00266:             Toast.makeText(this.mContext.getContext(), this.mContext.getString(R.string.success), 1).show();
00267:         } else if (i2 == 2) {
00268:             ProgressUtils.hideLoadingViewFullPage();
00269:             Toast.makeText(this.mContext.getContext(), this.mContext.getString(R.string.fail), 1).show();
00270:         }
00271:         return super.handleMessage(message);
00272:     }
00273: 
00274:     public Intent CutForPhoto(Uri uri) {
00275:         try {
00276:             Intent intent = new Intent("com.android.camera.action.CROP");
00277:             File file = new File(new File(Environment.getExternalStoragePublicDirectory("Pictures").getPath()), this.devId + this.zoneId + ".png");
00278:             if (file.exists()) {
00279:                 file.delete();
00280:             }
00281:             file.createNewFile();
00282:             WindowManager windowManager = (WindowManager) this.mContext.getContext().getSystemService("window");
00283:             DisplayMetrics displayMetrics = new DisplayMetrics();
00284:             windowManager.getDefaultDisplay().getMetrics(displayMetrics);
00285:             int i2 = displayMetrics.widthPixels;
00286:             Uri uriFromFile = Uri.fromFile(file);
00287:             intent.putExtra("crop", true);
00288:             intent.putExtra(CropExtras.KEY_ASPECT_X, i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f));
```

### Excerpt 2: lines 305–335

Reasons: IIC-800 structural marker.

```java
00305:             e2.printStackTrace();
00306:             return null;
00307:         }
00308:     }
00309: 
00310:     private void startCrop(Uri uri) {
00311:         try {
00312:             File file = new File(new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image")), this.devId + this.zoneId + ".png");
00313:             if (file.exists()) {
00314:                 file.delete();
00315:             }
00316:             file.createNewFile();
00317:             WindowManager windowManager = (WindowManager) this.mContext.getContext().getSystemService("window");
00318:             DisplayMetrics displayMetrics = new DisplayMetrics();
00319:             windowManager.getDefaultDisplay().getMetrics(displayMetrics);
00320:             int i2 = displayMetrics.widthPixels;
00321:             UCrop.of(uri, Uri.fromFile(file)).withAspectRatio(i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f), DisplayUtil.dp2px(this.mContext.getContext(), 80.0f)).withMaxResultSize(i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f), DisplayUtil.dp2px(this.mContext.getContext(), 80.0f)).withOptions(new UCrop.Options()).start(this.mContext.getContext(), this.mContext);
00322:         } catch (IOException e2) {
00323:             e2.printStackTrace();
00324:         }
00325:     }
00326: 
00327:     public boolean getPowerStatus() {
00328:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00329:         if (deviceBean == null || deviceBean.getDps() == null) {
00330:             return false;
00331:         }
00332:         Object obj = deviceBean.getDps().get("101");
00333:         return !"OFF".equals(obj != null ? obj.toString() : "OFF");
00334:     }
00335: }
```


## `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter`

Methods detected: `onSuccess, onError, Iic800SchedulePresenter, onDestroy, if, editPlan, setBackground, startManuals, if, while, stopManual, if, for, if, if, setPlan, parseIICZoneBean, if, if, if, if, setScheduleTime, if, if, if, if, openAlbum, openCamera, if, deleteBg, if, if, onActivityResult, if, if, if, if, CutForPhoto, if, if, if, startCrop, if, handleMessage, if`

### Excerpt 1: lines 1–264

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.presenter;
00002: 
00003: import android.content.Intent;
00004: import android.graphics.Bitmap;
00005: import android.net.Uri;
00006: import android.os.Environment;
00007: import android.os.Message;
00008: import android.util.DisplayMetrics;
00009: import android.view.WindowManager;
00010: import android.widget.Toast;
00011: import androidx.fragment.app.Fragment;
00012: import com.inkbird.base.common.wifi.DeviceUtils;
00013: import com.inkbird.base.utils.DisplayUtil;
00014: import com.inkbird.base.utils.PhotoUtils;
00015: import com.inkbird.base.utils.StringUtils;
00016: import com.inkbird.base.utils.file.FileProviderCompat;
00017: import com.inkbird.base.utils.file.FileUtils;
00018: import com.inkbird.inkbirdapp.R;
00019: import com.inkbird.inkbirdapp.device.iic800.activity.activity.Iic800AddPlanActivity;
00020: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00021: import com.inkbird.inkbirdapp.device.iic800.view.Iic800ScheduleView;
00022: import com.thingclips.smart.android.mvp.presenter.BasePresenter;
00023: import com.thingclips.smart.home.sdk.ThingHomeSdk;
00024: import com.thingclips.smart.multimedia.crop.CropExtras;
00025: import com.thingclips.smart.sdk.api.IResultCallback;
00026: import com.thingclips.smart.sdk.api.IThingDevice;
00027: import com.thingclips.smart.uispecs.component.ProgressUtils;
00028: import com.yalantis.ucrop.UCrop;
00029: import java.io.File;
00030: import java.io.IOException;
00031: import java.text.SimpleDateFormat;
00032: import java.util.Date;
00033: import java.util.Iterator;
00034: import java.util.List;
00035: 
00036: public class Iic800SchedulePresenter extends BasePresenter {
00037:     private static final int OPERATION_FAILED = 2;
00038:     private static final int OPERATION_SUCCESSFUL = 1;
00039:     private String devId;
00040:     private Uri imageUri;
00041:     private Fragment mContext;
00042:     private IThingDevice mDevice;
00043:     private Iic800ScheduleView mView;
00044:     private final IResultCallback resultCallback = new IResultCallback() {
00045:         @Override
00046:         public void onSuccess() {
00047:             Iic800SchedulePresenter.this.mHandler.sendEmptyMessage(1);
00048:         }
00049: 
00050:         @Override
00051:         public void onError(String str, String str2) {
00052:             Iic800SchedulePresenter.this.mHandler.sendEmptyMessage(2);
00053:         }
00054:     };
00055:     private int zoneId;
00056: 
00057:     public Iic800SchedulePresenter(Fragment fragment, Iic800ScheduleView iic800ScheduleView) {
00058:         this.mContext = fragment;
00059:         this.mView = iic800ScheduleView;
00060:         String stringExtra = fragment.getActivity().getIntent().getStringExtra("devId");
00061:         this.devId = stringExtra;
00062:         this.mDevice = ThingHomeSdk.newDeviceInstance(stringExtra);
00063:     }
00064: 
00065:     @Override
00066:     public void onDestroy() {
00067:         super.onDestroy();
00068:         IThingDevice iThingDevice = this.mDevice;
00069:         if (iThingDevice != null) {
00070:             iThingDevice.onDestroy();
00071:         }
00072:     }
00073: 
00074:     public void editPlan(IicZoneBean iicZoneBean) {
00075:         Intent intent = new Intent(this.mContext.getActivity(), (Class<?>) Iic800AddPlanActivity.class);
00076:         intent.putExtra("devId", this.devId);
00077:         intent.putExtra("iicZoneBean", iicZoneBean);
00078:         this.mContext.startActivity(intent);
00079:     }
00080: 
00081:     public void setBackground(int i2) {
00082:         this.zoneId = i2;
00083:     }
00084: 
00085:     public void startManuals(List<IicZoneBean> list) {
00086:         if (this.mDevice != null) {
00087:             StringBuilder sb = new StringBuilder();
00088:             StringBuilder sb2 = new StringBuilder();
00089:             Iterator<IicZoneBean> it = list.iterator();
00090:             while (it.hasNext()) {
00091:                 sb.append(StringUtils.intToHex(it.next().getRemainTime(), 4));
00092:                 sb2.append(StringUtils.intToHex(0, 4));
00093:             }
00094:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00095:             DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00096:         }
00097:     }
00098: 
00099:     public void stopManual(List<IicZoneBean> list) {
00100:         if (this.mDevice != null) {
00101:             StringBuilder sb = new StringBuilder();
00102:             StringBuilder sb2 = new StringBuilder();
00103:             boolean z = false;
00104:             for (IicZoneBean iicZoneBean : list) {
00105:                 if (iicZoneBean.isWateringSwitch()) {
00106:                     sb.append(StringUtils.intToHex(0, 4));
00107:                     sb2.append(StringUtils.intToHex(0, 4));
00108:                     z = true;
00109:                 } else {
00110:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00111:                     sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00112:                 }
00113:             }
00114:             if (z) {
00115:                 ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00116:                 DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00117:             }
00118:         }
00119:     }
00120: 
00121:     public void setPlan(IicZoneBean iicZoneBean) {
00122:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00123:         DeviceUtils.sendCommand("38", parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1), iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.resultCallback);
00124:     }
00125: 
00126:     private String parseIICZoneBean(int i2, IicZoneBean iicZoneBean) {
00127:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(i2, 2));
00128:         sb.append(StringUtils.intToHex(iicZoneBean.getRunTime(), 2));
00129:         for (int i3 = 0; i3 < 6; i3++) {
00130:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00131:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00132:             } else {
00133:                 sb.append("FF");
00134:             }
00135:         }
00136:         for (int i4 = 0; i4 < 6; i4++) {
00137:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00138:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00139:             } else {
00140:                 sb.append("FF");
00141:             }
00142:         }
00143:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00144:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00145:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00146:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00147:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00148:         if (iicZoneBean.isEnable()) {
00149:             sb.append("1");
00150:         } else {
00151:             sb.append("0");
00152:         }
00153:         if (iicZoneBean.isSeaAdjSwitch()) {
00154:             sb.append("1");
00155:         } else {
00156:             sb.append("0");
00157:         }
00158:         return sb.toString();
00159:     }
00160: 
00161:     public void setScheduleTime(IicZoneBean iicZoneBean, int i2) {
00162:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(1 << (iicZoneBean.getZoneId() - 1), 2));
00163:         sb.append(StringUtils.intToHex(i2, 2));
00164:         for (int i3 = 0; i3 < 6; i3++) {
00165:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00166:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00167:             } else {
00168:                 sb.append("FF");
00169:             }
00170:         }
00171:         for (int i4 = 0; i4 < 6; i4++) {
00172:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00173:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00174:             } else {
00175:                 sb.append("FF");
00176:             }
00177:         }
00178:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00179:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00180:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00181:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00182:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00183:         if (iicZoneBean.isEnable()) {
00184:             sb.append("1");
00185:         } else {
00186:             sb.append("0");
00187:         }
00188:         if (iicZoneBean.isSeaAdjSwitch()) {
00189:             sb.append("1");
00190:         } else {
00191:             sb.append("0");
00192:         }
00193:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00194:         DeviceUtils.sendCommand("38", sb.toString(), this.mDevice, this.resultCallback);
00195:     }
00196: 
00197:     public void openAlbum() {
00198:         this.mContext.startActivityForResult(PhotoUtils.getAlbumIntent(), 1);
00199:     }
00200: 
00201:     public void openCamera() {
00202:         File file = new File(new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image")), "inkbird" + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date(System.currentTimeMillis())) + ".png");
00203:         String path = file.getPath();
00204:         File file2 = new File(path.substring(0, path.lastIndexOf(File.separator)));
00205:         if (!file2.exists()) {
00206:             file2.mkdirs();
00207:         }
00208:         Intent intent = new Intent("android.media.action.IMAGE_CAPTURE");
00209:         Uri uriForFile = FileProviderCompat.getUriForFile(this.mContext.getContext(), file);
00210:         this.imageUri = uriForFile;
00211:         intent.putExtra("output", uriForFile);
00212:         this.mContext.startActivityForResult(intent, 19);
00213:     }
00214: 
00215:     public void deleteBg() {
00216:         try {
00217:             File file = new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image"));
00218:             File file2 = new File(Environment.getExternalStoragePublicDirectory("Pictures").getPath());
00219:             File file3 = new File(file, this.devId + this.zoneId + ".png");
00220:             File file4 = new File(file2, this.devId + this.zoneId + ".png");
00221:             if (file3.exists()) {
00222:                 file3.delete();
00223:             }
00224:             if (file4.exists()) {
00225:                 file4.delete();
00226:             }
00227:         } catch (Exception e2) {
00228:             e2.printStackTrace();
00229:         }
00230:         this.mView.updateItem(this.zoneId);
00231:     }
00232: 
00233:     public void onActivityResult(int i2, int i3, Intent intent) {
00234:         if (i3 == -1) {
00235:             if (i2 == 1) {
00236:                 if (intent != null) {
00237:                     startCrop(intent.getData());
00238:                 }
00239:             } else if (i2 == 19) {
00240:                 startCrop(this.imageUri);
00241:             } else {
00242:                 if (i2 != 69) {
00243:                     return;
00244:                 }
00245:                 this.mView.updateItem(this.zoneId);
00246:             }
00247:         }
00248:     }
00249: 
00250:     public Intent CutForPhoto(Uri uri) {
00251:         try {
00252:             Intent intent = new Intent("com.android.camera.action.CROP");
00253:             File file = new File(new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image")), this.devId + this.zoneId + ".png");
00254:             if (file.exists()) {
00255:                 file.delete();
00256:             }
00257:             file.createNewFile();
00258:             WindowManager windowManager = (WindowManager) this.mContext.getContext().getSystemService("window");
00259:             DisplayMetrics displayMetrics = new DisplayMetrics();
00260:             windowManager.getDefaultDisplay().getMetrics(displayMetrics);
00261:             int i2 = displayMetrics.widthPixels;
00262:             Uri uriFromFile = Uri.fromFile(file);
00263:             intent.putExtra("crop", true);
00264:             intent.putExtra(CropExtras.KEY_ASPECT_X, i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f));
```

### Excerpt 2: lines 281–299

Reasons: IIC-800 structural marker.

```java
00281:             e2.printStackTrace();
00282:             return null;
00283:         }
00284:     }
00285: 
00286:     private void startCrop(Uri uri) {
00287:         try {
00288:             File file = new File(new File(FileUtils.getSafeFileDir(this.mContext.requireContext(), "image")), this.devId + this.zoneId + ".png");
00289:             if (file.exists()) {
00290:                 file.delete();
00291:             }
00292:             file.createNewFile();
00293:             WindowManager windowManager = (WindowManager) this.mContext.getContext().getSystemService("window");
00294:             DisplayMetrics displayMetrics = new DisplayMetrics();
00295:             windowManager.getDefaultDisplay().getMetrics(displayMetrics);
00296:             int i2 = displayMetrics.widthPixels;
00297:             UCrop.of(uri, Uri.fromFile(file)).withAspectRatio(i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f), DisplayUtil.dp2px(this.mContext.getContext(), 80.0f)).withMaxResultSize(i2 - DisplayUtil.dp2px(this.mContext.getContext(), 40.0f), DisplayUtil.dp2px(this.mContext.getContext(), 80.0f)).withOptions(new UCrop.Options()).start(this.mContext.getContext(), this.mContext);
00298:         } catch (IOException e2) {
00299:             e2.printStackTrace();
```


## `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter`

Methods detected: `onError, onSuccess, onError, onSuccess, if, Iic800AddPlanPresenter, initData, if, if, onDestroy, reset, if, setPlan, if, if, if, while, handleMessage, if, parseIICZoneBean, if, if, if, if, getZoneNumbers, setZoneNumbers`

### Excerpt 1: lines 1–192

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.presenter;
00002: 
00003: import android.app.Activity;
00004: import android.content.SharedPreferences;
00005: import android.os.Message;
00006: import android.util.Log;
00007: import android.widget.Toast;
00008: import com.inkbird.base.common.wifi.DeviceUtils;
00009: import com.inkbird.base.utils.StringUtils;
00010: import com.inkbird.inkbirdapp.R;
00011: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00012: import com.inkbird.inkbirdapp.device.iic800.bean.ZoneNumber;
00013: import com.inkbird.inkbirdapp.device.iic800.view.Iic800AddPlanView;
00014: import com.thingclips.smart.android.mvp.presenter.BasePresenter;
00015: import com.thingclips.smart.home.sdk.ThingHomeSdk;
00016: import com.thingclips.smart.sdk.api.IResultCallback;
00017: import com.thingclips.smart.uispecs.component.ProgressUtils;
00018: import java.io.File;
00019: import java.util.Iterator;
00020: import java.util.List;
00021: 
00022: public class Iic800AddPlanPresenter extends BasePresenter {
00023:     private static final int OPERATION_FAILED = 2;
00024:     private static final int OPERATION_SUCCESSFUL = 1;
00025:     private List<IicZoneBean> checkZones;
00026:     private String devId;
00027:     private IicZoneBean iicZoneBean;
00028:     private Activity mContext;
00029:     private Iic800AddPlanView mView;
00030:     private SharedPreferences sharedPreferences;
00031:     private List<ZoneNumber> zoneNumbers;
00032:     private IResultCallback setCallback = new IResultCallback() {
00033:         @Override
00034:         public void onError(String str, String str2) {
00035:             Iic800AddPlanPresenter.this.mHandler.sendEmptyMessage(2);
00036:         }
00037: 
00038:         @Override
00039:         public void onSuccess() {
00040:             Iic800AddPlanPresenter.this.mHandler.sendEmptyMessage(1);
00041:         }
00042:     };
00043:     private IResultCallback resetCallback = new IResultCallback() {
00044:         @Override
00045:         public void onError(String str, String str2) {
00046:             Iic800AddPlanPresenter.this.mHandler.sendEmptyMessage(2);
00047:             Iic800AddPlanPresenter.this.mContext.finish();
00048:         }
00049: 
00050:         @Override
00051:         public void onSuccess() {
00052:             SharedPreferences.Editor editorEdit = Iic800AddPlanPresenter.this.sharedPreferences.edit();
00053:             editorEdit.putString(Iic800AddPlanPresenter.this.devId + Iic800AddPlanPresenter.this.iicZoneBean.getZoneId() + "name", null);
00054:             editorEdit.apply();
00055:             File file = new File(new File(Iic800AddPlanPresenter.this.mContext.getExternalFilesDir("images").getPath()), Iic800AddPlanPresenter.this.devId + Iic800AddPlanPresenter.this.iicZoneBean.getZoneId() + ".png");
00056:             if (file.exists()) {
00057:                 file.delete();
00058:             }
00059:             Iic800AddPlanPresenter.this.mHandler.sendEmptyMessage(1);
00060:             Iic800AddPlanPresenter.this.mContext.finish();
00061:         }
00062:     };
00063: 
00064:     public Iic800AddPlanPresenter(Activity activity, Iic800AddPlanView iic800AddPlanView) {
00065:         this.mContext = activity;
00066:         this.mView = iic800AddPlanView;
00067:         initData();
00068:     }
00069: 
00070:     private void initData() {
00071:         this.devId = this.mContext.getIntent().getStringExtra("devId");
00072:         this.iicZoneBean = (IicZoneBean) this.mContext.getIntent().getSerializableExtra("iicZoneBean");
00073:         this.checkZones = (List) this.mContext.getIntent().getSerializableExtra("zoneBeans");
00074:         Activity activity = this.mContext;
00075:         SharedPreferences sharedPreferences = activity.getSharedPreferences(activity.getPackageName(), 0);
00076:         this.sharedPreferences = sharedPreferences;
00077:         if (this.checkZones == null) {
00078:             this.iicZoneBean.setName(sharedPreferences.getString(this.devId + this.iicZoneBean.getZoneId() + "name", null));
00079:             if (this.iicZoneBean.getRunTime() > 0) {
00080:                 this.mView.initDataViews(this.iicZoneBean);
00081:                 return;
00082:             } else {
00083:                 this.mView.setZoneNumberText(this.iicZoneBean.getZoneId(), this.iicZoneBean.isTotalSeaSwitch(), this.iicZoneBean.isEnable());
00084:                 return;
00085:             }
00086:         }
00087:         this.mView.setZonesNumberText();
00088:     }
00089: 
00090:     @Override
00091:     public void onDestroy() {
00092:         super.onDestroy();
00093:     }
00094: 
00095:     public void reset() {
00096:         IicZoneBean iicZoneBean = this.iicZoneBean;
00097:         if (iicZoneBean != null && iicZoneBean.getRunTime() > 0) {
00098:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00099:             DeviceUtils.sendCommand("38", StringUtils.intToHex(1 << (this.iicZoneBean.getZoneId() - 1), 2) + "00ffffffffffffffffffffffff007f15090101", ThingHomeSdk.newDeviceInstance(this.devId), this.resetCallback);
00100:         } else {
00101:             this.mContext.finish();
00102:         }
00103:     }
00104: 
00105:     public void setPlan(IicZoneBean iicZoneBean) {
00106:         try {
00107:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00108:         } catch (Exception e2) {
00109:             e2.printStackTrace();
00110:         }
00111:         if (this.iicZoneBean != null) {
00112:             if (iicZoneBean.getName() != null && !iicZoneBean.getName().equals("")) {
00113:                 SharedPreferences.Editor editorEdit = this.sharedPreferences.edit();
00114:                 editorEdit.putString(this.devId + iicZoneBean.getZoneId() + "name", iicZoneBean.getName());
00115:                 editorEdit.apply();
00116:             }
00117:             DeviceUtils.sendCommand("38", parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1), iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.setCallback);
00118:             return;
00119:         }
00120:         List<ZoneNumber> list = this.zoneNumbers;
00121:         if (list == null || list.size() == 0) {
00122:             return;
00123:         }
00124:         Iterator<ZoneNumber> it = this.zoneNumbers.iterator();
00125:         int num = 0;
00126:         while (it.hasNext()) {
00127:             num += 1 << (it.next().getNum() - 1);
00128:         }
00129:         DeviceUtils.sendCommand("38", parseIICZoneBean(num, iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.setCallback);
00130:     }
00131: 
00132:     @Override
00133:     public boolean handleMessage(Message message) {
00134:         int i2 = message.what;
00135:         if (i2 == 1) {
00136:             ProgressUtils.hideLoadingViewFullPage();
00137:             Activity activity = this.mContext;
00138:             Toast.makeText(activity, activity.getString(R.string.success), 1).show();
00139:             this.mContext.finish();
00140:         } else if (i2 == 2) {
00141:             ProgressUtils.hideLoadingViewFullPage();
00142:             Activity activity2 = this.mContext;
00143:             Toast.makeText(activity2, activity2.getString(R.string.fail), 1).show();
00144:             this.mContext.finish();
00145:         }
00146:         return super.handleMessage(message);
00147:     }
00148: 
00149:     private String parseIICZoneBean(int i2, IicZoneBean iicZoneBean) {
00150:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(i2, 2));
00151:         sb.append(StringUtils.intToHex(iicZoneBean.getRunTime(), 2));
00152:         for (int i3 = 0; i3 < 6; i3++) {
00153:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00154:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00155:             } else {
00156:                 sb.append("FF");
00157:             }
00158:         }
00159:         for (int i4 = 0; i4 < 6; i4++) {
00160:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00161:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00162:             } else {
00163:                 sb.append("FF");
00164:             }
00165:         }
00166:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00167:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00168:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00169:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00170:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00171:         if (iicZoneBean.isEnable()) {
00172:             sb.append("1");
00173:         } else {
00174:             sb.append("0");
00175:         }
00176:         if (iicZoneBean.isSeaAdjSwitch()) {
00177:             sb.append("1");
00178:         } else {
00179:             sb.append("0");
00180:         }
00181:         Log.i("我发的38", sb.toString());
00182:         return sb.toString();
00183:     }
00184: 
00185:     public List<ZoneNumber> getZoneNumbers() {
00186:         return this.zoneNumbers;
00187:     }
00188: 
00189:     public void setZoneNumbers(List<ZoneNumber> list) {
00190:         this.zoneNumbers = list;
00191:     }
00192: }
```


## `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter`

Methods detected: `onSuccess, onError, onDevInfoUpdate, onNetworkStatusChanged, onStatusChanged, Iic800SettingsPresenter, initData, if, if, if, onDestroy, if, changeRainSensor, if, goOtaUpdate, changeMainValve, if, changeSeaAdjValue, if, goMore, if, resetDevice, if, setPowerStatus, if, if, handleMessage, if, onDpUpdate, if, if, onRemoved, if, showMainValueDialog, onClick, onClick, lambda$showMainValueDialog$0`

### Excerpt 1: lines 5–164

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00005: import android.content.Intent;
00006: import android.content.SharedPreferences;
00007: import android.os.Message;
00008: import android.view.View;
00009: import android.widget.TextView;
00010: import android.widget.Toast;
00011: import com.inkbird.base.common.wifi.DeviceUtils;
00012: import com.inkbird.inkbirdapp.R;
00013: import com.inkbird.inkbirdapp.device.iic800.activity.activity.DeviceUpdateActivity;
00014: import com.inkbird.inkbirdapp.device.iic800.model.IIic800SettingsModel;
00015: import com.inkbird.inkbirdapp.device.iic800.model.Iic800SettingsModel;
00016: import com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant;
00017: import com.inkbird.inkbirdapp.device.iic800.view.IIic800SettingsView;
00018: import com.inkbird.inkbirdapp.tuya.ThingUtils;
00019: import com.thingclips.smart.android.mvp.presenter.BasePresenter;
00020: import com.thingclips.smart.home.sdk.ThingHomeSdk;
00021: import com.thingclips.smart.sdk.api.IDevListener;
00022: import com.thingclips.smart.sdk.api.IResultCallback;
00023: import com.thingclips.smart.sdk.api.IThingDevice;
00024: import com.thingclips.smart.sdk.bean.DeviceBean;
00025: import com.thingclips.smart.uispecs.component.ProgressUtils;
00026: 
00027: public class Iic800SettingsPresenter extends BasePresenter implements IDevListener {
00028:     private static final int OPERATION_FAILED = 2;
00029:     private static final int OPERATION_SUCCESSFUL = 1;
00030:     private String devId;
00031:     private Activity mContext;
00032:     private IThingDevice mDevice;
00033:     private IIic800SettingsModel mModel;
00034:     private IIic800SettingsView mView;
00035:     private final IResultCallback resultCallback = new IResultCallback() {
00036:         @Override
00037:         public void onSuccess() {
00038:             Iic800SettingsPresenter.this.mHandler.sendEmptyMessage(1);
00039:         }
00040: 
00041:         @Override
00042:         public void onError(String str, String str2) {
00043:             Iic800SettingsPresenter.this.mHandler.sendEmptyMessage(2);
00044:         }
00045:     };
00046: 
00047:     @Override
00048:     public void onDevInfoUpdate(String str) {
00049:     }
00050: 
00051:     @Override
00052:     public void onNetworkStatusChanged(String str, boolean z) {
00053:     }
00054: 
00055:     @Override
00056:     public void onStatusChanged(String str, boolean z) {
00057:     }
00058: 
00059:     public Iic800SettingsPresenter(Activity activity, IIic800SettingsView iIic800SettingsView) {
00060:         this.mContext = activity;
00061:         this.mView = iIic800SettingsView;
00062:         this.mModel = new Iic800SettingsModel(activity, this.mHandler);
00063:         initData();
00064:     }
00065: 
00066:     private void initData() {
00067:         this.devId = this.mContext.getIntent().getStringExtra("devId");
00068:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00069:         IThingDevice iThingDeviceNewDeviceInstance = ThingHomeSdk.newDeviceInstance(this.devId);
00070:         this.mDevice = iThingDeviceNewDeviceInstance;
00071:         if (iThingDeviceNewDeviceInstance != null) {
00072:             iThingDeviceNewDeviceInstance.registerDevListener(this);
00073:         }
00074:         if (deviceBean != null) {
00075:             this.mView.setRainSenTotal(this.mModel.getRainSenTotal(deviceBean));
00076:             this.mView.setSenAdjRange(this.mModel.getSenAdj(deviceBean));
00077:             this.mView.setPowerStatus(this.mModel.getPowerStatus(deviceBean));
00078:             if (Iic800Constant.devType.equals(Iic800Constant.IIC_800)) {
00079:                 return;
00080:             }
00081:             this.mView.setMainValue(this.mModel.getMainValue2(deviceBean));
00082:         }
00083:     }
00084: 
00085:     @Override
00086:     public void onDestroy() {
00087:         super.onDestroy();
00088:         IThingDevice iThingDevice = this.mDevice;
00089:         if (iThingDevice != null) {
00090:             iThingDevice.unRegisterDevListener();
00091:         }
00092:     }
00093: 
00094:     public void changeRainSensor() {
00095:         ProgressUtils.showLoadingViewFullPage(this.mContext);
00096:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00097:         if (deviceBean != null) {
00098:             DeviceUtils.sendCommand("102", Boolean.valueOf(!this.mModel.getRainSenTotal(deviceBean)), this.mDevice, this.resultCallback);
00099:         }
00100:     }
00101: 
00102:     public void goOtaUpdate() {
00103:         Intent intent = new Intent(this.mContext, (Class<?>) DeviceUpdateActivity.class);
00104:         intent.putExtra("devId", this.devId);
00105:         this.mContext.startActivity(intent);
00106:     }
00107: 
00108:     public void changeMainValve() {
00109:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00110:         if (deviceBean != null && this.mModel.getMainValue2(deviceBean)) {
00111:             showMainValueDialog();
00112:         } else {
00113:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00114:             DeviceUtils.sendCommand("111", true, this.mDevice, this.resultCallback);
00115:         }
00116:     }
00117: 
00118:     public void changeSeaAdjValue(int i2) {
00119:         Activity activity = this.mContext;
00120:         if (activity != null) {
00121:             ProgressUtils.showLoadingViewFullPage(activity);
00122:         }
00123:         DeviceUtils.sendCommand("103", Integer.valueOf(i2), this.mDevice, this.resultCallback);
00124:     }
00125: 
00126:     public void goMore() {
00127:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00128:         if (deviceBean != null) {
00129:             ThingUtils.goPanelMore(this.mContext, deviceBean.getDevId(), deviceBean.getName());
00130:         }
00131:     }
00132: 
00133:     public void resetDevice() {
00134:         Activity activity = this.mContext;
00135:         SharedPreferences.Editor editorEdit = activity.getSharedPreferences(activity.getPackageName(), 0).edit();
00136:         for (int i2 = 1; i2 <= 8; i2++) {
00137:             editorEdit.putBoolean(this.devId + i2 + "SeaAdjSwitch", true);
00138:         }
00139:         editorEdit.apply();
00140:         Activity activity2 = this.mContext;
00141:         if (activity2 != null) {
00142:             ProgressUtils.showLoadingViewFullPage(activity2);
00143:         }
00144:         DeviceUtils.sendCommand("105", true, this.mDevice, this.resultCallback);
00145:     }
00146: 
00147:     public void setPowerStatus() {
00148:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00149:         if (deviceBean != null) {
00150:             if (this.mModel.getPowerStatus(deviceBean)) {
00151:                 DeviceUtils.sendCommand("101", "OFF", this.mDevice, this.resultCallback);
00152:             } else {
00153:                 DeviceUtils.sendCommand("101", "Auto", this.mDevice, this.resultCallback);
00154:             }
00155:         }
00156:     }
00157: 
00158:     @Override
00159:     public boolean handleMessage(Message message) {
00160:         int i2 = message.what;
00161:         if (i2 == 1) {
00162:             ProgressUtils.hideLoadingViewFullPage();
00163:             Activity activity = this.mContext;
00164:             Toast.makeText(activity, activity.getString(R.string.success), 1).show();
```

### Excerpt 2: lines 172–190

Reasons: IIC-800 structural marker.

```java
00172: 
00173:     @Override
00174:     public void onDpUpdate(String str, String str2) {
00175:         DeviceBean deviceBean;
00176:         if (!str.equals(this.devId) || (deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(str)) == null) {
00177:             return;
00178:         }
00179:         this.mView.setRainSenTotal(this.mModel.getRainSenTotal(deviceBean));
00180:         this.mView.setSenAdjRange(this.mModel.getSenAdj(deviceBean));
00181:         this.mView.setPowerStatus(this.mModel.getPowerStatus(deviceBean));
00182:         if (Iic800Constant.devType.equals(Iic800Constant.IIC_800)) {
00183:             return;
00184:         }
00185:         this.mView.setMainValue(this.mModel.getMainValue2(deviceBean));
00186:     }
00187: 
00188:     @Override
00189:     public void onRemoved(String str) {
00190:         if (str.equals(this.devId)) {
```


## `com.inkbird.inkbirdapp.device.iic800.activity.fragment.Iic800ManualFragment`

Methods detected: `onCreateView, onDestroy, if, if, onActivityResult, initView, if, initListener, onClick, onClick, onClick, onClick, onClick, lambda$initListener$0, lambda$initListener$1, lambda$initListener$2, if, lambda$initListener$3, lambda$initListener$4, initList, if, while, initPresenter, updateItem, for, if, setBackground, clickTime, seekBarChanged, for, if, if, haveSelected, showNotice, onClick, onClick, if, accept, if, run, lambda$showNotice$5, lambda$showNotice$6, isChecked, if, if, for, if, if, setBottomBtnContent, if, editMulti, cancelEdit, editMultiNext, onEvent, if, if, setManualStatus, for, if, if, if, if, if, scrollToManual, if, Handler, run, lambda$scrollToManual$7, requestPermission, if, onRequestPermissionsResult, if, for, if, setStartDisable, setStartEnable, setResetEnable, showSelectBgDialog, onClick, onClick, onClick, onClick, lambda$showSelectBgDialog$8, lambda$showSelectBgDialog$9, lambda$showSelectBgDialog$10, showSetMultiZonesDialog, onStartTrackingTouch, onRangeChanged, if, onStopTrackingTouch, if, onClick, onClick, onClick, lambda$showSetMultiZonesDialog$12, lambda$showSetMultiZonesDialog$14, if, if, for, if, showSetTimeDialog, afterTextChanged, beforeTextChanged, onTextChanged, if, if, if, onClick, onClick, lambda$showSetTimeDialog$16, if, if, for, if, showSetTimeDialog, afterTextChanged, beforeTextChanged, onTextChanged, if, if, if, onClick, onClick, lambda$showSetTimeDialog$18, if, if, showResetDialog, onClick, onClick, lambda$showResetDialog$19, if, UpdateAllChannels, if, for, for, if, if, if`

### Excerpt 1: lines 23–131

Reasons: IIC-800 structural marker.

```java
00023: import androidx.recyclerview.widget.LinearLayoutManager;
00024: import androidx.recyclerview.widget.RecyclerView;
00025: import com.inkbird.base.permission.PermissionUtil;
00026: import com.inkbird.base.utils.ActivityManager;
00027: import com.inkbird.inkbirdapp.R;
00028: import com.inkbird.inkbirdapp.base.widget.popwindow.PopWindowUtil;
00029: import com.inkbird.inkbirdapp.device.iic800.activity.activity.Iic800Activity;
00030: import com.inkbird.inkbirdapp.device.iic800.adapter.ManualAdapter;
00031: import com.inkbird.inkbirdapp.device.iic800.adapter.NumberAdapter;
00032: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00033: import com.inkbird.inkbirdapp.device.iic800.bean.ZoneNumber;
00034: import com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter;
00035: import com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant;
00036: import com.inkbird.inkbirdapp.device.iic800.view.Iic800ManualView;
00037: import com.inkbird.inkbirdapp.device.iic800.widget.TopSmoothScroller;
00038: import com.jaygoo.widget.OnRangeChangedListener;
00039: import com.jaygoo.widget.RangeSeekBar;
00040: import com.thingclips.sdk.eventbus.EventBus;
00041: import com.thingclips.smart.android.tangram.model.ConfigPath;
00042: import io.reactivex.rxjava3.core.Observable;
00043: import io.reactivex.rxjava3.disposables.Disposable;
00044: import io.reactivex.rxjava3.functions.Consumer;
00045: import java.util.ArrayList;
00046: import java.util.List;
00047: import java.util.concurrent.TimeUnit;
00048: 
00049: public class Iic800ManualFragment extends Fragment implements Iic800ManualView, ManualAdapter.ManualWaterListener {
00050:     private Iic800Activity activity;
00051:     private ManualAdapter adapter;
00052:     private LinearLayout bottomBtnLayout;
00053:     private ImageView bottomImage;
00054:     private TextView bottomText;
00055:     private TextView cancelText;
00056:     private TextView centerText;
00057:     private TextView confirmText;
00058:     private Disposable disposable;
00059:     private RelativeLayout editBottomLayout;
00060:     private ImageView nextIV;
00061:     private TextView nextTV;
00062:     private Iic800ManualPresenter presenter;
00063:     private RecyclerView recyclerView;
00064:     private int zoneNum;
00065:     private List<IicZoneBean> zoneBeans = new ArrayList();
00066:     private int wateringZoneId = 0;
00067:     private List<ZoneNumber> zoneNumbers = new ArrayList();
00068: 
00069:     @Override
00070:     public View onCreateView(LayoutInflater layoutInflater, ViewGroup viewGroup, Bundle bundle) {
00071:         View viewInflate = layoutInflater.inflate(R.layout.fragment_iic800_manual, viewGroup, false);
00072:         initList();
00073:         initView(viewInflate);
00074:         initListener();
00075:         initPresenter();
00076:         EventBus.getDefault().register(this);
00077:         return viewInflate;
00078:     }
00079: 
00080:     @Override
00081:     public void onDestroy() {
00082:         super.onDestroy();
00083:         Iic800ManualPresenter iic800ManualPresenter = this.presenter;
00084:         if (iic800ManualPresenter != null) {
00085:             iic800ManualPresenter.onDestroy();
00086:         }
00087:         EventBus.getDefault().unregister(this);
00088:         Disposable disposable = this.disposable;
00089:         if (disposable == null || disposable.isDisposed()) {
00090:             return;
00091:         }
00092:         this.disposable.dispose();
00093:     }
00094: 
00095:     @Override
00096:     public void onActivityResult(int i2, int i3, Intent intent) {
00097:         super.onActivityResult(i2, i3, intent);
00098:         this.presenter.onActivityResult(i2, i3, intent);
00099:     }
00100: 
00101:     private void initView(View view) {
00102:         this.centerText = (TextView) view.findViewById(R.id.tv_center_btn);
00103:         this.bottomImage = (ImageView) view.findViewById(R.id.iv_manual_bottom);
00104:         this.bottomText = (TextView) view.findViewById(R.id.tv_manual_bottom);
00105:         this.nextIV = (ImageView) view.findViewById(R.id.iv_next);
00106:         this.nextTV = (TextView) view.findViewById(R.id.tv_next);
00107:         this.cancelText = (TextView) view.findViewById(R.id.tv_bottom_cancel);
00108:         this.confirmText = (TextView) view.findViewById(R.id.tv_bottom_confirm);
00109:         this.bottomBtnLayout = (LinearLayout) view.findViewById(R.id.ll_manual_bottom_btn);
00110:         this.editBottomLayout = (RelativeLayout) view.findViewById(R.id.rl_edit_bottom_layout);
00111:         RecyclerView recyclerView = (RecyclerView) view.findViewById(R.id.fragment_mw_recycler);
00112:         this.recyclerView = recyclerView;
00113:         ((DefaultItemAnimator) recyclerView.getItemAnimator()).setSupportsChangeAnimations(false);
00114:         this.recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
00115:         if (this.recyclerView.getItemAnimator() != null) {
00116:             this.recyclerView.getItemAnimator().setChangeDuration(0L);
00117:         }
00118:         ManualAdapter manualAdapter = new ManualAdapter(getContext(), this.zoneBeans, this, getActivity().getIntent().getStringExtra("devId"));
00119:         this.adapter = manualAdapter;
00120:         this.recyclerView.setAdapter(manualAdapter);
00121:         this.activity = (Iic800Activity) getActivity();
00122:     }
00123: 
00124:     private void initListener() {
00125:         this.nextTV.setOnClickListener(new View.OnClickListener() {
00126:             @Override
00127:             public final void onClick(View view) {
00128:                 this.f$0.lambda$initListener$0(view);
00129:             }
00130:         });
00131:         this.bottomText.setOnClickListener(new View.OnClickListener() {
```

### Excerpt 2: lines 140–403

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00140:                 this.f$0.lambda$initListener$2(view);
00141:             }
00142:         });
00143:         this.cancelText.setOnClickListener(new View.OnClickListener() {
00144:             @Override
00145:             public final void onClick(View view) {
00146:                 this.f$0.lambda$initListener$3(view);
00147:             }
00148:         });
00149:         this.confirmText.setOnClickListener(new View.OnClickListener() {
00150:             @Override
00151:             public final void onClick(View view) {
00152:                 this.f$0.lambda$initListener$4(view);
00153:             }
00154:         });
00155:     }
00156: 
00157:     public void lambda$initListener$0(View view) {
00158:         this.presenter.stopManual(this.zoneBeans);
00159:     }
00160: 
00161:     public void lambda$initListener$1(View view) {
00162:         showSetMultiZonesDialog();
00163:     }
00164: 
00165:     public void lambda$initListener$2(View view) {
00166:         if (this.centerText.isSelected()) {
00167:             this.presenter.stopAllManual();
00168:         } else {
00169:             this.presenter.startManuals(this.zoneBeans);
00170:         }
00171:     }
00172: 
00173:     public void lambda$initListener$3(View view) {
00174:         cancelEdit();
00175:     }
00176: 
00177:     public void lambda$initListener$4(View view) {
00178:         editMultiNext();
00179:     }
00180: 
00181:     private void initList() {
00182:         this.zoneBeans.clear();
00183:         if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00184:             this.zoneNum = 4;
00185:         } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00186:             this.zoneNum = 6;
00187:         } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_801)) {
00188:             this.zoneNum = 8;
00189:         } else {
00190:             this.zoneNum = 8;
00191:         }
00192:         int i2 = 0;
00193:         while (i2 < this.zoneNum) {
00194:             i2++;
00195:             this.zoneBeans.add(new IicZoneBean(i2));
00196:         }
00197:         this.zoneNumbers.clear();
00198:         for (int i3 = 1; i3 <= this.zoneNum; i3++) {
00199:             this.zoneNumbers.add(new ZoneNumber(i3));
00200:         }
00201:         this.zoneNumbers.get(0).setSelect(true);
00202:     }
00203: 
00204:     private void initPresenter() {
00205:         this.presenter = new Iic800ManualPresenter(this, this);
00206:     }
00207: 
00208:     @Override
00209:     public void updateItem(int i2) {
00210:         for (IicZoneBean iicZoneBean : this.zoneBeans) {
00211:             if (iicZoneBean != null && iicZoneBean.getZoneId() == i2) {
00212:                 EventBus.getDefault().post(iicZoneBean);
00213:                 return;
00214:             }
00215:         }
00216:     }
00217: 
00218:     @Override
00219:     public void setBackground(int i2) {
00220:         this.presenter.setBackground(i2);
00221:         requestPermission(PermissionUtil.getMediaOrCameraPermission());
00222:     }
00223: 
00224:     @Override
00225:     public void clickTime(int i2) {
00226:         showSetTimeDialog(i2);
00227:     }
00228: 
00229:     @Override
00230:     public void seekBarChanged() {
00231:         setStartDisable();
00232:         for (IicZoneBean iicZoneBean : this.zoneBeans) {
00233:             if ("Manual".equals(iicZoneBean.getWorkMode()) && iicZoneBean.isWateringSwitch()) {
00234:                 setResetEnable();
00235:                 if (iicZoneBean.getManualTime() == 0) {
00236:                     this.presenter.stopManual(this.zoneBeans);
00237:                     return;
00238:                 } else {
00239:                     this.presenter.changeManuals(this.zoneBeans);
00240:                     return;
00241:                 }
00242:             }
00243:             iicZoneBean.getManualTime();
00244:         }
00245:     }
00246: 
00247:     @Override
00248:     public void haveSelected(boolean z) {
00249:         this.confirmText.setEnabled(z);
00250:     }
00251: 
00252:     @Override
00253:     public void showNotice(final IicZoneBean iicZoneBean) {
00254:         final Dialog dialog = new Dialog(getActivity(), R.style.NormalDialog);
00255:         dialog.setContentView(View.inflate(getActivity(), R.layout.dialog_iic800_tips, null));
00256:         dialog.show();
00257:         ((TextView) dialog.findViewById(R.id.tv_content)).setText(getString(R.string.iic800_sure_change_time_tips));
00258:         dialog.setCanceledOnTouchOutside(false);
00259:         TextView textView = (TextView) dialog.findViewById(R.id.tv_confirm);
00260:         TextView textView2 = (TextView) dialog.findViewById(R.id.tv_cancel);
00261:         textView2.setText(R.string.normal_cancel3);
00262:         textView.setText(R.string.normal_confirm3);
00263:         textView.setOnClickListener(new View.OnClickListener() {
00264:             @Override
00265:             public final void onClick(View view) {
00266:                 this.f$0.lambda$showNotice$5(dialog, view);
00267:             }
00268:         });
00269:         textView2.setOnClickListener(new View.OnClickListener() {
00270:             @Override
00271:             public final void onClick(View view) {
00272:                 this.f$0.lambda$showNotice$6(dialog, iicZoneBean, view);
00273:             }
00274:         });
00275:         Disposable disposable = this.disposable;
00276:         if (disposable != null && !disposable.isDisposed()) {
00277:             this.disposable.dispose();
00278:         }
00279:         this.disposable = Observable.timer(10L, TimeUnit.SECONDS).subscribe(new Consumer<Long>() {
00280:             @Override
00281:             public void accept(Long l) throws Throwable {
00282:                 Dialog dialog2 = dialog;
00283:                 if (dialog2 == null || !dialog2.isShowing()) {
00284:                     return;
00285:                 }
00286:                 Iic800ManualFragment.this.getActivity().runOnUiThread(new Runnable() {
00287:                     @Override
00288:                     public void run() {
00289:                         dialog.dismiss();
00290:                         iicZoneBean.setManualTime(iicZoneBean.getRemainTime());
00291:                         Iic800ManualFragment.this.adapter.notifyItemChanged(Iic800ManualFragment.this.zoneBeans.indexOf(iicZoneBean));
00292:                     }
00293:                 });
00294:             }
00295:         });
00296:     }
00297: 
00298:     public void lambda$showNotice$5(Dialog dialog, View view) {
00299:         dialog.dismiss();
00300:         seekBarChanged();
00301:     }
00302: 
00303:     public void lambda$showNotice$6(Dialog dialog, IicZoneBean iicZoneBean, View view) {
00304:         dialog.dismiss();
00305:         iicZoneBean.setManualTime(iicZoneBean.getRemainTime());
00306:         this.adapter.notifyItemChanged(this.zoneBeans.indexOf(iicZoneBean));
00307:     }
00308: 
00309:     @Override
00310:     public void isChecked(int i2, int i3) {
00311:         if (this.activity.isOnline) {
00312:             if (!this.presenter.getPowerStatus()) {
00313:                 PopWindowUtil.getInstance().showTips(ActivityManager.getAppManager().currentActivity(), getString(R.string.normal_tip), getString(R.string.msg_power_switch));
00314:                 return;
00315:             }
00316:             for (IicZoneBean iicZoneBean : this.zoneBeans) {
00317:                 if ("Auto".equals(iicZoneBean.getWorkMode()) && iicZoneBean.isWateringSwitch()) {
00318:                     showResetDialog(getString(R.string.msg_implementation_manual_plan), null, null, i2);
00319:                     return;
00320:                 }
00321:             }
00322:             if (i3 == 180) {
00323:                 this.zoneBeans.get(i2).setManualTime(180);
00324:                 this.zoneBeans.get(i2).setWateredTime(0);
00325:             } else {
00326:                 this.zoneBeans.get(i2).setManualTime(0);
00327:                 this.zoneBeans.get(i2).setWateredTime(0);
00328:             }
00329:             this.presenter.startManuals(this.zoneBeans);
00330:         }
00331:     }
00332: 
00333:     private void setBottomBtnContent(boolean z) {
00334:         if (z) {
00335:             this.nextIV.setVisibility(0);
00336:             this.nextTV.setVisibility(0);
00337:         } else {
00338:             this.nextIV.setVisibility(8);
00339:             this.nextTV.setVisibility(8);
00340:         }
00341:     }
00342: 
00343:     private void editMulti() {
00344:         this.adapter.setMulMode(true);
00345:         this.centerText.setVisibility(8);
00346:         this.bottomBtnLayout.setVisibility(8);
00347:         this.editBottomLayout.setVisibility(0);
00348:     }
00349: 
00350:     private void cancelEdit() {
00351:         this.adapter.setMulMode(false);
00352:         this.confirmText.setEnabled(false);
00353:         this.centerText.setVisibility(0);
00354:         this.bottomBtnLayout.setVisibility(0);
00355:         this.editBottomLayout.setVisibility(8);
00356:     }
00357: 
00358:     private void editMultiNext() {
00359:         cancelEdit();
00360:     }
00361: 
00362:     public void onEvent(IicZoneBean iicZoneBean) {
00363:         if (this.zoneBeans.contains(iicZoneBean)) {
00364:             if ("Manual".equals(iicZoneBean.getWorkMode())) {
00365:                 iicZoneBean.setManualTime(iicZoneBean.getRemainTime());
00366:             }
00367:             int iIndexOf = this.zoneBeans.indexOf(iicZoneBean);
00368:             this.zoneBeans.set(iIndexOf, iicZoneBean);
00369:             this.adapter.notifyItemChanged(iIndexOf);
00370:             Log.i("运行时间：", iicZoneBean.getWorkMode() + "------Manual-" + iicZoneBean.getManualTime() + "------Watered-" + iicZoneBean.getWateredTime() + "------Remain-" + iicZoneBean.getRemainTime() + "index----" + iIndexOf + "WateringSwitch-----" + iicZoneBean.isWateringSwitch());
00371:             setManualStatus();
00372:         }
00373:     }
00374: 
00375:     private void setManualStatus() {
00376:         this.adapter.setIsStarted(false);
00377:         boolean z = false;
00378:         for (IicZoneBean iicZoneBean : this.zoneBeans) {
00379:             if ("Manual".equals(iicZoneBean.getWorkMode()) && iicZoneBean.isWateringSwitch()) {
00380:                 setResetEnable();
00381:                 this.adapter.setIsStarted(true);
00382:                 setBottomBtnContent(true);
00383:                 if (this.wateringZoneId == iicZoneBean.getZoneId() || iicZoneBean.getManualTime() <= 0) {
00384:                     return;
00385:                 }
00386:                 Log.d("zoneInfo.getZoneId()", this.wateringZoneId + "-----" + iicZoneBean.getZoneId());
00387:                 Log.i("zoneInfo.getZoneId()", iicZoneBean.getWorkMode() + "------Manual-" + iicZoneBean.getManualTime() + "------Watered-" + iicZoneBean.getWateredTime() + "------Remain-" + iicZoneBean.getRemainTime() + "----WateringSwitch-----" + iicZoneBean.isWateringSwitch());
00388:                 scrollToManual(iicZoneBean.getZoneId());
00389:                 this.wateringZoneId = iicZoneBean.getZoneId();
00390:                 return;
00391:             }
00392:             if ("Manual".equals(iicZoneBean.getWorkMode())) {
00393:                 if (iicZoneBean.getRemainTime() > 0) {
00394:                     z = true;
00395:                 }
00396:             } else if (iicZoneBean.getManualTime() > 0) {
00397:                 z = true;
00398:             }
00399:         }
00400:         this.wateringZoneId = 0;
00401:         if (!z) {
00402:             setStartDisable();
00403:         }
```

### Excerpt 3: lines 736–781

Reasons: strong protocol marker.

```java
00736:             }
00737:         });
00738:         dialog.findViewById(R.id.tv_cancel).setOnClickListener(new View.OnClickListener() {
00739:             @Override
00740:             public final void onClick(View view) {
00741:                 dialog.dismiss();
00742:             }
00743:         });
00744:     }
00745: 
00746:     public void lambda$showResetDialog$19(Dialog dialog, TextView textView, List list, int i2, View view) {
00747:         dialog.dismiss();
00748:         if (textView != null) {
00749:             UpdateAllChannels(textView, list);
00750:             return;
00751:         }
00752:         this.zoneBeans.get(i2).setManualTime(180);
00753:         this.zoneBeans.get(i2).setWateredTime(0);
00754:         this.presenter.startManuals(this.zoneBeans);
00755:     }
00756: 
00757:     private void UpdateAllChannels(TextView textView, List<IicZoneBean> list) {
00758:         if (!this.presenter.getPowerStatus()) {
00759:             PopWindowUtil.getInstance().showTips(ActivityManager.getAppManager().currentActivity(), getActivity().getString(R.string.normal_tip), getActivity().getString(R.string.msg_power_switch));
00760:             return;
00761:         }
00762:         String string = textView.getText().toString();
00763:         int i2 = string.isEmpty() ? 0 : Integer.parseInt(string);
00764:         for (IicZoneBean iicZoneBean : list) {
00765:             for (IicZoneBean iicZoneBean2 : this.zoneBeans) {
00766:                 if (iicZoneBean.getZoneId() == iicZoneBean2.getZoneId()) {
00767:                     iicZoneBean2.setManualTime(i2);
00768:                     Log.d(iicZoneBean2.getZoneId() + ConfigPath.PATH_SEPARATOR, "----" + iicZoneBean2.getManualTime());
00769:                 }
00770:             }
00771:         }
00772:         if (list.size() == 0) {
00773:             Toast.makeText(getActivity(), getString(R.string.msg_an_irrigation_area), 1).show();
00774:         } else {
00775:             this.presenter.startManuals(this.zoneBeans);
00776:         }
00777:         if (i2 > 0) {
00778:             list.size();
00779:         }
00780:     }
00781: }
```


## `com.inkbird.inkbirdapp.device.iic800.activity.activity.Iic800AddPlanActivity`

Methods detected: `m8315$r8$lambda$8DZXiri3wYQbJv70_3YfR9N2V4, m8316$r8$lambda$FtjDFB_nPMC1hzH69iqNov_5WU, m8317$r8$lambda$JEctzEi1ze730oaPsyCZoyNtI, m8318$r8$lambda$LayUaqUSu8nV0eupqHRfJJ7aJY, $r8$lambda$OoqsaX1aeD5dZkFJUHKebjNNxcE, $r8$lambda$PvhrGbi15WGnH93FtMzXqbSh1fc, $r8$lambda$VUejKrGkvvpGGcNeQ7jpQP4oofE, m8319$r8$lambda$WRpZsTGuQba14O_SRLP0wqJUQg, m8320$r8$lambda$_0CsTR9FmMn7LL3UQu6F8BK1lw, $r8$lambda$qVR8nz4bKHybc4oqFXAJV0pQIlU, m8321$$Nest$fgetrsbTipText, m8322$$Nest$fgettimeText, Iic800AddPlanActivity, onCreate, onDestroy, initViews, initListener, lambda$initListener$0, initPresenter, goBack, reset, done, onClick, addStartTime, setZoneNumberText, lambda$setZoneNumberText$1, setZonesNumberText, lambda$setZonesNumberText$2, initDataViews, lambda$initDataViews$3, showRainSensorDialog, lambda$showRainSensorDialog$4, showTimeDialog, lambda$showTimeDialog$5, showIntervalDialog, lambda$showIntervalDialog$6, showStartDateDialog, lambda$showStartDateDialog$7, differentDaysByMillisecond, showSetTimeDialog, lambda$showSetTimeDialog$8, lambda$showSetTimeDialog$9, showResetDialog, lambda$showResetDialog$10, lambda$showResetDialog$11, showCopyZonesDialog, lambda$showCopyZonesDialog$12, lambda$showCopyZonesDialog$13`

### Excerpt 1: lines 14–245

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00014: import android.widget.RadioGroup;
00015: import android.widget.RelativeLayout;
00016: import android.widget.TextView;
00017: import android.widget.Toast;
00018: import androidx.recyclerview.widget.DefaultItemAnimator;
00019: import androidx.recyclerview.widget.GridLayoutManager;
00020: import androidx.recyclerview.widget.LinearLayoutManager;
00021: import androidx.recyclerview.widget.RecyclerView;
00022: import com.inkbird.base.activity.BaseActivity;
00023: import com.inkbird.base.utils.StringUtils;
00024: import com.inkbird.inkbirdapp.R;
00025: import com.inkbird.inkbirdapp.device.iic800.adapter.CopyLicZoneBeanAdapter;
00026: import com.inkbird.inkbirdapp.device.iic800.adapter.NumberAdapter;
00027: import com.inkbird.inkbirdapp.device.iic800.adapter.SetStartTimeAdapter;
00028: import com.inkbird.inkbirdapp.device.iic800.adapter.WeekAdapter;
00029: import com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean;
00030: import com.inkbird.inkbirdapp.device.iic800.bean.StartTimeBean;
00031: import com.inkbird.inkbirdapp.device.iic800.bean.ZoneNumber;
00032: import com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter;
00033: import com.inkbird.inkbirdapp.device.iic800.utils.Iic800Constant;
00034: import com.inkbird.inkbirdapp.device.iic800.view.Iic800AddPlanView;
00035: import com.inkbird.inkbirdapp.device.iic800.widget.FlowRadioGroup;
00036: import com.jaygoo.widget.RangeSeekBar;
00037: import com.weigan.loopview.LoopView;
00038: import io.reactivex.rxjava3.core.Observable;
00039: import io.reactivex.rxjava3.disposables.Disposable;
00040: import java.text.DateFormat;
00041: import java.text.ParseException;
00042: import java.util.ArrayList;
00043: import java.util.Date;
00044: import java.util.Iterator;
00045: import java.util.List;
00046: import java.util.Locale;
00047: import java.util.concurrent.TimeUnit;
00048: 
00049: public class Iic800AddPlanActivity extends BaseActivity implements Iic800AddPlanView, View.OnClickListener, SetStartTimeAdapter.StartTimeAddListener {
00050:     private List<IicZoneBean> checkZones;
00051:     private LinearLayout contentLayout;
00052:     private ImageView copyIV;
00053:     private TextView dateText;
00054:     private String devId;
00055:     private Disposable disposable;
00056:     private boolean finalTotalSea;
00057:     private List<IicZoneBean> haveCheckZones;
00058:     private LinearLayout intervalsLayout;
00059:     private TextView intervalsText;
00060:     private boolean isChecked;
00061:     private EditText nameEdit;
00062:     private TextView numberText;
00063:     private RecyclerView numbersRV;
00064:     private FlowRadioGroup periodGroup;
00065:     private Iic800AddPlanPresenter presenter;
00066:     private TextView rainText;
00067:     private RangeSeekBar rangeSeekBar;
00068:     private RadioButton rb_sea_yes;
00069:     private TextView resetText;
00070:     private TextView rsbTipText;
00071:     private RadioGroup sensorGroup;
00072:     private SharedPreferences sharedPreferences;
00073:     private RecyclerView startRv;
00074:     private SetStartTimeAdapter startTimeAdapter;
00075:     private TextView timeText;
00076:     private WeekAdapter weekAdapter;
00077:     private RecyclerView weekRv;
00078:     private List<ZoneNumber> zoneNumbers;
00079: 
00080:     public static void m8315$r8$lambda$8DZXiri3wYQbJv70_3YfR9N2V4(Iic800AddPlanActivity r0, Dialog r1, CopyLicZoneBeanAdapter r2, View r3) {
00081:         r0.lambda$showCopyZonesDialog$13(r1, r2, r3);
00082:     }
00083: 
00084:     public static void m8316$r8$lambda$FtjDFB_nPMC1hzH69iqNov_5WU(Iic800AddPlanActivity r0, RadioGroup r1, int r2) {
00085:         r0.lambda$initListener$0(r1, r2);
00086:     }
00087: 
00088:     public static void m8317$r8$lambda$JEctzEi1ze730oaPsyCZoyNtI(Iic800AddPlanActivity r0, View r1) {
00089:         r0.lambda$setZoneNumberText$1(r1);
00090:     }
00091: 
00092:     public static void m8318$r8$lambda$LayUaqUSu8nV0eupqHRfJJ7aJY(Iic800AddPlanActivity r0, Dialog r1, View r2) {
00093:         r0.lambda$showResetDialog$10(r1, r2);
00094:     }
00095: 
00096:     public static void $r8$lambda$OoqsaX1aeD5dZkFJUHKebjNNxcE(Iic800AddPlanActivity r0, IicZoneBean r1, View r2) {
00097:         r0.lambda$initDataViews$3(r1, r2);
00098:     }
00099: 
00100:     public static void $r8$lambda$PvhrGbi15WGnH93FtMzXqbSh1fc(Iic800AddPlanActivity r0, Dialog r1, List r2, LoopView r3, List r4, LoopView r5, View r6) {
00101:         r0.lambda$showTimeDialog$5(r1, r2, r3, r4, r5, r6);
00102:     }
00103: 
00104:     public static void $r8$lambda$VUejKrGkvvpGGcNeQ7jpQP4oofE(Iic800AddPlanActivity r0, DatePicker r1, RelativeLayout r2, Dialog r3, View r4) {
00105:         r0.lambda$showStartDateDialog$7(r1, r2, r3, r4);
00106:     }
00107: 
00108:     public static void m8319$r8$lambda$WRpZsTGuQba14O_SRLP0wqJUQg(Iic800AddPlanActivity r0, Dialog r1, EditText r2, View r3) {
00109:         r0.lambda$showSetTimeDialog$9(r1, r2, r3);
00110:     }
00111: 
00112:     public static void m8320$r8$lambda$_0CsTR9FmMn7LL3UQu6F8BK1lw(Iic800AddPlanActivity r0, View r1) {
00113:         r0.lambda$setZonesNumberText$2(r1);
00114:     }
00115: 
00116:     public static void $r8$lambda$qVR8nz4bKHybc4oqFXAJV0pQIlU(Iic800AddPlanActivity r0, Dialog r1, List r2, LoopView r3, View r4) {
00117:         r0.lambda$showIntervalDialog$6(r1, r2, r3, r4);
00118:     }
00119: 
00120:     static TextView m8321$$Nest$fgetrsbTipText(Iic800AddPlanActivity r0) {
00121:         return r0.rsbTipText;
00122:     }
00123: 
00124:     static TextView m8322$$Nest$fgettimeText(Iic800AddPlanActivity r0) {
00125:         return r0.timeText;
00126:     }
00127: 
00128:     public Iic800AddPlanActivity() {
00129:         this.zoneNumbers = new ArrayList();
00130:         this.haveCheckZones = new ArrayList();
00131:     }
00132: 
00133:     @Override
00134:     protected void onCreate(Bundle r1) {
00135:         super.onCreate(r1);
00136:         setContentView(R.layout.activity_iic800_add_plan);
00137:         initViews();
00138:         initListener();
00139:         initPresenter();
00140:     }
00141: 
00142:     @Override
00143:     protected void onDestroy() {
00144:         super.onDestroy();
00145:         this.presenter.onDestroy();
00146:         Disposable r0 = this.disposable;
00147:         if (r0 != null) goto L5;
00148:         return;
00149:     L5:
00150:         if (r0.isDisposed() == true) goto L9;
00151:         this.disposable.dispose();
00152:         return;
00153:     }
00154: 
00155:     private void initViews() {
00156:         this.resetText = (TextView) findViewById(R.id.tv_reset);
00157:         this.rainText = (TextView) findViewById(R.id.tv_rain_title);
00158:         this.numberText = (TextView) findViewById(R.id.tv_zone_number);
00159:         this.numbersRV = (RecyclerView) findViewById(R.id.zone_number_rv);
00160:         this.rsbTipText = (TextView) findViewById(R.id.tv_rsb_tip);
00161:         this.nameEdit = (EditText) findViewById(R.id.et_zone_name);
00162:         this.periodGroup = (FlowRadioGroup) findViewById(R.id.rg_watering_period);
00163:         this.sensorGroup = (RadioGroup) findViewById(R.id.rg_rain_sensor);
00164:         this.rb_sea_yes = (RadioButton) findViewById(R.id.rb_sensor_yes);
00165:         this.weekRv = (RecyclerView) findViewById(R.id.rv_week);
00166:         this.intervalsLayout = (LinearLayout) findViewById(R.id.ll_intervals);
00167:         this.intervalsText = (TextView) findViewById(R.id.tv_intervals);
00168:         this.dateText = (TextView) findViewById(R.id.tv_intervals_date);
00169:         this.rangeSeekBar = (RangeSeekBar) findViewById(R.id.rsb_time);
00170:         this.timeText = (TextView) findViewById(R.id.tv_single_time);
00171:         this.contentLayout = (LinearLayout) findViewById(R.id.ll_plan_content);
00172:         this.startRv = (RecyclerView) findViewById(R.id.rv_start_time);
00173:         this.copyIV = (ImageView) findViewById(R.id.copy_iv);
00174:         this.sharedPreferences = getSharedPreferences(getPackageName(), 0);
00175:         this.devId = getIntent().getStringExtra("devId");
00176:         this.checkZones = (List) getIntent().getSerializableExtra("zoneBeans");
00177:         this.haveCheckZones.clear();
00178:         List<IicZoneBean> r0 = this.checkZones;
00179:         if (r0 != null) goto L5;
00180:     L15:
00181:         final int r1 = 4;
00182:         GridLayoutManager r2 = new AnonymousClass1(this, this, r1);
00183:         this.weekRv.setLayoutManager(r2);
00184:         WeekAdapter r3 = new WeekAdapter(this);
00185:         this.weekAdapter = r3;
00186:         this.weekRv.setAdapter(r3);
00187:         final int r4 = 3;
00188:         GridLayoutManager r5 = new AnonymousClass2(this, this, r4);
00189:         this.startRv.setLayoutManager(r5);
00190:         SetStartTimeAdapter r6 = new SetStartTimeAdapter(this, this);
00191:         this.startTimeAdapter = r6;
00192:         this.startRv.setAdapter(r6);
00193:         DateFormat r7 = DateFormat.getDateInstance(2, Locale.getDefault());
00194:         this.dateText.setText(r7.format(new Date()));
00195:         return;
00196:     L5:
00197:         if (r0.size() == 0) goto L15;
00198:         Iterator<IicZoneBean> r8 = this.checkZones.iterator();
00199:     L8:
00200:         if (r8.hasNext() == false) goto L14;
00201:         IicZoneBean r9 = r8.next();
00202:         if (r9.getStartTimeList() == null) goto L8;
00203:         if (r9.getStartTimeList().size() == 0) goto L8;
00204:         this.haveCheckZones.add(r9);
00205:         goto L8
00206:     L14:
00207:         this.isChecked = true;
00208:         goto L15
00209:     }
00210: 
00211:     private void initListener() {
00212:         this.intervalsText.setOnClickListener(this);
00213:         this.dateText.setOnClickListener(this);
00214:         this.timeText.setOnClickListener(this);
00215:         this.copyIV.setOnClickListener(this);
00216:         this.rangeSeekBar.setOnRangeChangedListener(new AnonymousClass3(this));
00217:         this.periodGroup.setOnCheckedChangeListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda1(this));
00218:         this.zoneNumbers.clear();
00219:         if (Iic800Constant.devType.equals(Iic800Constant.IIC_400) == false) goto L6;
00220:         int r0 = 4;
00221:     L9:
00222:         int r2 = 1;
00223:     L10:
00224:         if (r2 > r0) goto L12;
00225:         this.zoneNumbers.add(new ZoneNumber(r2));
00226:         r2 = r2 + 1;
00227:         goto L10
00228:     L12:
00229:         this.zoneNumbers.get(0).setSelect(true);
00230:         return;
00231:     L6:
00232:         if (Iic800Constant.devType.equals(Iic800Constant.IIC_600) == false) goto L8;
00233:         r0 = 6;
00234:         goto L9
00235:     L8:
00236:         Iic800Constant.devType.equals(Iic800Constant.IIC_801);
00237:         r0 = 8;
00238:         goto L9
00239:     }
00240: 
00241:     private void lambda$initListener$0(RadioGroup r3, int r4) {
00242:         if (r4 != R.id.rb_odd_days) goto L12;
00243:         if (this.weekRv.getVisibility() != 0) goto L8;
00244:         this.weekRv.setVisibility(8);
00245:     L8:
```

### Excerpt 2: lines 266–559

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00266:         if (this.intervalsLayout.getVisibility() != 0) goto L40;
00267:         this.intervalsLayout.setVisibility(8);
00268:         return;
00269:     L40:
00270:         return;
00271:     L30:
00272:         if (r4 == R.id.rb_intervals) goto L32;
00273:         return;
00274:     L32:
00275:         if (this.weekRv.getVisibility() != 0) goto L35;
00276:         this.weekRv.setVisibility(8);
00277:     L35:
00278:         if (this.intervalsLayout.getVisibility() != 8) goto L42;
00279:         this.intervalsLayout.setVisibility(0);
00280:         return;
00281:     }
00282: 
00283:     private void initPresenter() {
00284:         this.presenter = new Iic800AddPlanPresenter(this, this);
00285:     }
00286: 
00287:     public void goBack(View r1) {
00288:         finish();
00289:     }
00290: 
00291:     public void reset(View r1) {
00292:         showResetDialog();
00293:     }
00294: 
00295:     public void done(View r8) {
00296:         if (this.numbersRV.getVisibility() != 0) goto L16;
00297:         ArrayList r9 = new ArrayList();
00298:         Iterator<ZoneNumber> r1 = this.zoneNumbers.iterator();
00299:     L6:
00300:         if (r1.hasNext() == false) goto L11;
00301:         ZoneNumber r2 = r1.next();
00302:         if (r2.isSelect() == false) goto L6;
00303:         r9.add(r2);
00304:         goto L6
00305:     L11:
00306:         if (r9.size() == 0) goto L13;
00307:         this.presenter.setZoneNumbers(r9);
00308:         goto L16
00309:     L13:
00310:         Toast.makeText(this, getString(R.string.msg_an_irrigation_area), 1).show();
00311:         return;
00312:     L16:
00313:         if (Integer.parseInt(this.timeText.getText().toString()) == 0) goto L18;
00314:     L21:
00315:         IicZoneBean r10 = new IicZoneBean(Integer.parseInt(this.numberText.getText().toString()));
00316:         r10.setName(this.nameEdit.getText().toString());
00317:         r10.setEnable(this.isChecked);
00318:         r10.setRunTime(Integer.parseInt(this.timeText.getText().toString()));
00319:         boolean r4 = false;
00320:         if (this.periodGroup.getCheckedRadioButtonId() != R.id.rb_customize) goto L25;
00321:         r10.setScheduleMode(0);
00322:         r10.setScheduleDay(this.weekAdapter.getChecks());
00323:     L39:
00324:         SharedPreferences.Editor r3 = this.sharedPreferences.edit();
00325:         r10.setTotalSeaSwitch(this.finalTotalSea);
00326:         if (r10.isTotalSeaSwitch() == true) goto L42;
00327:         r10.setSeaAdjSwitch(this.sharedPreferences.getBoolean(this.devId + r10.getZoneId() + "SeaAdjSwitch", true));
00328:     L47:
00329:         if (this.isChecked == true) goto L49;
00330:         r10.setStartTimeList(this.startTimeAdapter.getStartTimeBeans());
00331:         this.presenter.setPlan(r10);
00332:         return;
00333:     L49:
00334:         if (r10.getScheduleMode() == 0) goto L53;
00335:         if (r10.getScheduleMode() == 3) goto L53;
00336:     L55:
00337:         r10.setStartTimeList(this.startTimeAdapter.getStartTimeBeans());
00338:         if (r10.getStartTimeList().size() != 0) goto L58;
00339:         Toast.makeText(this, getString(R.string.iic800_irrigation_start_time_tip), 1).show();
00340:         return;
00341:     L58:
00342:         this.presenter.setPlan(r10);
00343:         return;
00344:     L53:
00345:         if (r10.getScheduleDay() != 0) goto L55;
00346:         Toast.makeText(this, getString(R.string.iic800_irrigation_date_tip), 1).show();
00347:         return;
00348:     L42:
00349:         if (this.sensorGroup.getCheckedRadioButtonId() != R.id.rb_sensor_yes) goto L44;
00350:         r4 = true;
00351:     L44:
00352:         r10.setSeaAdjSwitch(r4);
00353:         r3.putBoolean(this.devId + r10.getZoneId() + "SeaAdjSwitch", r10.isSeaAdjSwitch());
00354:         r3.apply();
00355:         goto L47
00356:     L25:
00357:         if (this.periodGroup.getCheckedRadioButtonId() != R.id.rb_odd_days) goto L28;
00358:         r10.setScheduleMode(1);
00359:         goto L39
00360:     L28:
00361:         if (this.periodGroup.getCheckedRadioButtonId() != R.id.rb_even_days) goto L31;
00362:         r10.setScheduleMode(2);
00363:         goto L39
00364:     L31:
00365:         if (this.periodGroup.getCheckedRadioButtonId() != R.id.rb_intervals) goto L39;
00366:         r10.setScheduleMode(3);
00367:         r10.setScheduleDay(Integer.parseInt(this.intervalsText.getText().toString()));
00368:         Date r5 = DateFormat.getDateInstance(2, Locale.getDefault()).parse(this.dateText.getText().toString());     // Catch: ParseException -> L37
00369:         if (r5 == null) goto L39;
00370:         r10.setIntervalYear(r5.getYear() - 100);     // Catch: ParseException -> L37
00371:         r10.setIntervalMonth(r5.getMonth() + 1);     // Catch: ParseException -> L37
00372:         r10.setIntervalDay(r5.getDate());     // Catch: ParseException -> L37
00373:     L37:
00374:         e = move-exception;
00375:         e.printStackTrace();
00376:         goto L39
00377:     L18:
00378:         if (this.isChecked == false) goto L21;
00379:         Toast.makeText(this, getString(R.string.iic800_irrigation_time_empty_tip), 1).show();
00380:     }
00381: 
00382:     @Override
00383:     public void onClick(View r3) {
00384:         if (r3.getId() != R.id.tv_intervals) goto L7;
00385:         showIntervalDialog();
00386:         return;
00387:     L7:
00388:         if (r3.getId() != R.id.tv_intervals_date) goto L11;
00389:         showStartDateDialog();
00390:         return;
00391:     L11:
00392:         if (r3.getId() != R.id.tv_single_time) goto L15;
00393:         showSetTimeDialog();
00394:         return;
00395:     L15:
00396:         if (r3.getId() == R.id.copy_iv) goto L17;
00397:         return;
00398:     L17:
00399:         if (this.haveCheckZones.size() != 0) goto L20;
00400:         Toast.makeText(this, getString(R.string.text_set_irrigation_area), 1).show();
00401:         return;
00402:     L20:
00403:         showCopyZonesDialog();
00404:     }
00405: 
00406:     @Override
00407:     public void addStartTime() {
00408:         showTimeDialog();
00409:     }
00410: 
00411:     @Override
00412:     public void setZoneNumberText(int r2, boolean r3, boolean r4) {
00413:         this.numberText.setText(String.valueOf(r2));
00414:         this.finalTotalSea = r3;
00415:         this.isChecked = r4;
00416:         if (r3 == true) goto L5;
00417:         this.sensorGroup.check(R.id.rb_sensor_no);
00418:         this.rb_sea_yes.setTextColor(getResources().getColor(R.color.veryGrayText));
00419:     L5:
00420:         this.rb_sea_yes.setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda7(this));
00421:     }
00422: 
00423:     private void lambda$setZoneNumberText$1(View r2) {
00424:         if (this.finalTotalSea == true) goto L6;
00425:         this.sensorGroup.check(R.id.rb_sensor_no);
00426:         showRainSensorDialog();
00427:         return;
00428:     }
00429: 
00430:     @Override
00431:     public void setZonesNumberText() {
00432:         NumberAdapter r0 = new NumberAdapter(this);
00433:         r0.setList(this.zoneNumbers);
00434:         this.numbersRV.setLayoutManager(new LinearLayoutManager(this, 0, false));
00435:         this.numbersRV.setAdapter(r0);
00436:         this.resetText.setVisibility(8);
00437:         this.numbersRV.setVisibility(0);
00438:         this.copyIV.setVisibility(0);
00439:         this.numberText.setVisibility(8);
00440:         this.nameEdit.setEnabled(false);
00441:         this.finalTotalSea = true;
00442:         this.rb_sea_yes.setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda9(this));
00443:     }
00444: 
00445:     private void lambda$setZonesNumberText$2(View r2) {
00446:         if (this.finalTotalSea == true) goto L6;
00447:         this.sensorGroup.check(R.id.rb_sensor_no);
00448:         showRainSensorDialog();
00449:         return;
00450:     }
00451: 
00452:     @Override
00453:     public void initDataViews(final IicZoneBean r5) {
00454:         this.finalTotalSea = r5.isTotalSeaSwitch();
00455:         this.numberText.setText(String.valueOf(r5.getZoneId()));
00456:         if (this.checkZones == null) goto L5;
00457:     L10:
00458:         this.isChecked = r5.isEnable();
00459:         if (r5.getScheduleMode() != 0) goto L14;
00460:         this.periodGroup.check(R.id.rb_customize);
00461:         this.weekAdapter.setChecks(r5.getScheduleDay());
00462:     L23:
00463:         if (r5.isTotalSeaSwitch() == true) goto L25;
00464:     L27:
00465:         this.sensorGroup.check(R.id.rb_sensor_no);
00466:     L29:
00467:         if (r5.isTotalSeaSwitch() == true) goto L31;
00468:         this.rb_sea_yes.setTextColor(getResources().getColor(R.color.veryGrayText));
00469:         this.rainText.setTextColor(getResources().getColor(R.color.veryGrayText));
00470:     L31:
00471:         this.rb_sea_yes.setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda8(this, r5));
00472:         this.rangeSeekBar.setProgress(r5.getRunTime());
00473:         if (r5.getStartTimeList() != null) goto L34;
00474:         return;
00475:     L34:
00476:         if (r5.getStartTimeList().size() <= 0) goto L41;
00477:         Iterator<StartTimeBean> r6 = r5.getStartTimeList().iterator();
00478:     L37:
00479:         if (r6.hasNext() == false) goto L42;
00480:         this.startTimeAdapter.addStartTime(r6.next());
00481:         goto L37
00482:     L42:
00483:         return;
00484:     L41:
00485:         return;
00486:     L25:
00487:         if (r5.isSeaAdjSwitch() == false) goto L27;
00488:         this.sensorGroup.check(R.id.rb_sensor_yes);
00489:         goto L29
00490:     L14:
00491:         if (r5.getScheduleMode() != 1) goto L17;
00492:         this.periodGroup.check(R.id.rb_odd_days);
00493:         goto L23
00494:     L17:
00495:         if (r5.getScheduleMode() != 2) goto L20;
00496:         this.periodGroup.check(R.id.rb_even_days);
00497:         goto L23
00498:     L20:
00499:         if (r5.getScheduleMode() != 3) goto L23;
00500:         this.periodGroup.check(R.id.rb_intervals);
00501:         this.intervalsText.setText(String.valueOf(r5.getScheduleDay()));
00502:         Date r0 = new Date();
00503:         r0.setYear(r5.getIntervalYear() + 100);
00504:         r0.setMonth(r5.getIntervalMonth() - 1);
00505:         r0.setDate(r5.getIntervalDay());
00506:         this.dateText.setText(DateFormat.getDateInstance(2, Locale.getDefault()).format(r0));
00507:         goto L23
00508:     L5:
00509:         if (r5.getName() != null) goto L7;
00510:     L9:
00511:         this.nameEdit.setHint(getString(R.string.iic800_zone_name));
00512:         goto L10
00513:     L7:
00514:         if (TextUtils.isEmpty(r5.getName()) == true) goto L9;
00515:         this.nameEdit.setHint(r5.getName());
00516:         goto L10
00517:     }
00518: 
00519:     private void lambda$initDataViews$3(IicZoneBean r1, View r2) {
00520:         if (r1.isTotalSeaSwitch() == true) goto L6;
00521:         this.sensorGroup.check(R.id.rb_sensor_no);
00522:         showRainSensorDialog();
00523:         return;
00524:     }
00525: 
00526:     private void showRainSensorDialog() {
00527:         final Dialog r0 = new Dialog(this, R.style.NormalDialog);
00528:         r0.setContentView(View.inflate(this, R.layout.dialog_iic800_tips, null));
00529:         r0.show();
00530:         ((TextView) r0.findViewById(R.id.tv_content)).setText(getString(R.string.iic800_rain_sensor_switch_tips));
00531:         r0.findViewById(R.id.tv_confirm).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda12(r0));
00532:         r0.findViewById(R.id.tv_cancel).setVisibility(4);
00533:     }
00534: 
00535:     static void lambda$showRainSensorDialog$4(Dialog r0, View r1) {
00536:         r0.dismiss();
00537:     }
00538: 
00539:     private void showTimeDialog() {
00540:         final Dialog r2 = new Dialog(this, R.style.NormalDialog);
00541:         r2.setContentView(View.inflate(this, R.layout.dialog_time_setting, null));
00542:         Window r0 = r2.getWindow();
00543:         r0.setGravity(80);
00544:         r0.setWindowAnimations(R.style.BottomDialogAnima);
00545:         r0.setLayout(-1, -2);
00546:         r2.show();
00547:         ((TextView) r2.findViewById(R.id.tv_device_choose_tempc_title)).setText(getString(R.string.iic800_start_time));
00548:         final LoopView r4 = (LoopView) r2.findViewById(R.id.lv_device_tempc1);
00549:         final LoopView r6 = (LoopView) r2.findViewById(R.id.lv_device_tempc2);
00550:         final ArrayList r3 = new ArrayList();
00551:         final ArrayList r5 = new ArrayList();
00552:         int r1 = 0;
00553:         int r7 = 0;
00554:     L4:
00555:         if (r7 >= 24) goto L7;
00556:         r3.add(StringUtils.intToLen(r7, 2));
00557:         r7 = r7 + 1;
00558:         goto L4
00559:     L7:
```

### Excerpt 3: lines 566–616

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00566:     L16:
00567:         r4.setItems(r3);
00568:         r6.setItems(r5);
00569:         Date r9 = new Date();
00570:         int r10 = 0;
00571:     L18:
00572:         if (r10 >= r3.size()) goto L24;
00573:         if (Integer.parseInt(r3.get(r10)) != r9.getHours()) goto L22;
00574:         r4.setCurrentPosition(r10);
00575:     L22:
00576:         r10 = r10 + 1;
00577:     L24:
00578:         if (r1 >= r5.size()) goto L29;
00579:         if (Integer.parseInt(r5.get(r1)) != r9.getMinutes()) goto L28;
00580:         r6.setCurrentPosition(r1);
00581:     L28:
00582:         r1 = r1 + 1;
00583:         goto L24
00584:     L29:
00585:         r2.findViewById(R.id.rl_device_choose_tempc_complete).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda4(this, r2, r3, r4, r5, r6));
00586:         return;
00587:     L12:
00588:         int r11 = 0;
00589:     L14:
00590:         if (r11 >= 60) goto L16;
00591:         r5.add(StringUtils.intToLen(r11, 2));
00592:         r11 = r11 + 1;
00593:         goto L14
00594:     }
00595: 
00596:     private void lambda$showTimeDialog$5(Dialog r1, List r2, LoopView r3, List r4, LoopView r5, View r6) {
00597:         r1.dismiss();
00598:         int r7 = Integer.parseInt((String) r2.get(r3.getSelectedItem()));
00599:         int r8 = Integer.parseInt((String) r4.get(r5.getSelectedItem()));
00600:         if (r7 == (-1)) goto L10;
00601:         if (r8 != (-1)) goto L7;
00602:         return;
00603:     L7:
00604:         if (this.startTimeAdapter.addStartTime(new StartTimeBean(r7, r8)) == true) goto L11;
00605:         Toast.makeText(this, getString(R.string.iic800_irrigation_start_time_same_tip), 1).show();
00606:         return;
00607:     L11:
00608:         return;
00609:     }
00610: 
00611:     private void showIntervalDialog() {
00612:         final Dialog r0 = new Dialog(this, R.style.NormalDialog);
00613:         r0.setContentView(View.inflate(this, R.layout.dialog_temp_f, null));
00614:         Window r1 = r0.getWindow();
00615:         r1.setGravity(80);
00616:         r1.setWindowAnimations(R.style.BottomDialogAnima);
```

### Excerpt 4: lines 622–767

Reasons: IIC-800 structural marker, strong protocol marker.

```java
00622:         int r4 = 1;
00623:     L4:
00624:         if (r4 >= 10) goto L6;
00625:         r3.add(String.valueOf(r4));
00626:         r4 = r4 + 1;
00627:         goto L4
00628:     L6:
00629:         r2.setItems(r3);
00630:         String r5 = this.intervalsText.getText().toString();
00631:         int r6 = 0;
00632:     L8:
00633:         if (r6 >= r3.size()) goto L13;
00634:         if (r3.get(r6).equals(r5) == false) goto L12;
00635:         r2.setCurrentPosition(r6);
00636:     L12:
00637:         r6 = r6 + 1;
00638:         goto L8
00639:     L13:
00640:         r0.findViewById(R.id.rl_device_choose_tempf_complete).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda13(this, r0, r3, r2));
00641:     }
00642: 
00643:     private void lambda$showIntervalDialog$6(Dialog r1, List r2, LoopView r3, View r4) {
00644:         r1.dismiss();
00645:         this.intervalsText.setText((CharSequence) r2.get(r3.getSelectedItem()));
00646:     }
00647: 
00648:     private void showStartDateDialog() {
00649:         final Dialog r0 = new Dialog(this, R.style.NormalDialog);
00650:         View r1 = View.inflate(this, R.layout.dialog_iic800_start_date, null);
00651:         r0.setContentView(r1);
00652:         Window r2 = r0.getWindow();
00653:         r2.setGravity(80);
00654:         r2.setWindowAnimations(R.style.BottomDialogAnima);
00655:         r2.setLayout(-1, -2);
00656:         r0.show();
00657:         final DatePicker r3 = (DatePicker) r0.findViewById(R.id.dp_schedule_intervals);
00658:         r3.setMinDate(System.currentTimeMillis() - 1000);
00659:         final RelativeLayout r4 = (RelativeLayout) r1.findViewById(R.id.tip_rl);
00660:         r0.findViewById(R.id.rl_start_date_complete).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda6(this, r3, r4, r0));
00661:     }
00662: 
00663:     private void lambda$showStartDateDialog$7(DatePicker r3, final RelativeLayout r4, Dialog r5, View r6) {
00664:         DateFormat r7 = DateFormat.getDateInstance(2, Locale.getDefault());
00665:         Date r0 = new Date();
00666:         r0.setYear(r3.getYear() - 1900);
00667:         r0.setMonth(r3.getMonth());
00668:         r0.setDate(r3.getDayOfMonth());
00669:         if (differentDaysByMillisecond(r0) == false) goto L11;
00670:         r4.setVisibility(0);
00671:         Disposable r8 = this.disposable;
00672:         if (r8 != null) goto L7;
00673:     L9:
00674:         this.disposable = Observable.timer(2, TimeUnit.SECONDS).subscribe(new AnonymousClass4(this, r4));
00675:         return;
00676:     L7:
00677:         if (r8.isDisposed() == true) goto L9;
00678:         this.disposable.dispose();
00679:         goto L9
00680:     L11:
00681:         r5.dismiss();
00682:         this.dateText.setText(r7.format(r0));
00683:     }
00684: 
00685:     public boolean differentDaysByMillisecond(Date r5) {
00686:         if (((int) ((r5.getTime() - System.currentTimeMillis()) / 86400000)) <= 14) goto L6;
00687:         return true;
00688:     L6:
00689:         return false;
00690:     }
00691: 
00692:     private void showSetTimeDialog() {
00693:         final Dialog r0 = new Dialog(this);
00694:         r0.setContentView(View.inflate(this, R.layout.dialog_iic800_set_time, null));
00695:         Window r1 = r0.getWindow();
00696:         r1.setLayout(-1, -2);
00697:         r0.show();
00698:         final EditText r2 = (EditText) r0.findViewById(R.id.et_watering_time);
00699:         r2.requestFocus();
00700:         r1.setSoftInputMode(5);
00701:         r2.setSelection(r2.getText().length());
00702:         r2.addTextChangedListener(new AnonymousClass5(this, r2));
00703:         r0.findViewById(R.id.tv_watering_time_cancel).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda10(r0));
00704:         r0.findViewById(R.id.tv_watering_time_confirm).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda11(this, r0, r2));
00705:     }
00706: 
00707:     static void lambda$showSetTimeDialog$8(Dialog r0, View r1) {
00708:         r0.dismiss();
00709:     }
00710: 
00711:     private void lambda$showSetTimeDialog$9(Dialog r1, EditText r2, View r3) {
00712:         r1.dismiss();
00713:         String r4 = r2.getText().toString();
00714:         if (TextUtils.isEmpty(r4) == true) goto L9;
00715:         int r5 = Integer.parseInt(r4);
00716:         if (r5 >= 0) goto L7;
00717:         r5 = 0;
00718:     L7:
00719:         this.rangeSeekBar.setProgress(r5);
00720:         return;
00721:     }
00722: 
00723:     private void showResetDialog() {
00724:         final Dialog r0 = new Dialog(this, R.style.NormalDialog);
00725:         r0.setContentView(View.inflate(this, R.layout.dialog_iic800_tips, null));
00726:         r0.show();
00727:         ((TextView) r0.findViewById(R.id.tv_content)).setText(getString(R.string.iic800_reset_zone_tips));
00728:         r0.findViewById(R.id.tv_confirm).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda0(this, r0));
00729:         r0.findViewById(R.id.tv_cancel).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda5(r0));
00730:     }
00731: 
00732:     private void lambda$showResetDialog$10(Dialog r1, View r2) {
00733:         r1.dismiss();
00734:         this.presenter.reset();
00735:     }
00736: 
00737:     static void lambda$showResetDialog$11(Dialog r0, View r1) {
00738:         r0.dismiss();
00739:     }
00740: 
00741:     private void showCopyZonesDialog() {
00742:         final Dialog r0 = new Dialog(this, R.style.NormalDialog);
00743:         r0.setContentView(View.inflate(this, R.layout.dialog_iic800_copy_zone, null));
00744:         Window r1 = r0.getWindow();
00745:         r1.setGravity(80);
00746:         r1.setWindowAnimations(R.style.BottomDialogAnima);
00747:         r1.setLayout(-1, -2);
00748:         r0.show();
00749:         RecyclerView r2 = (RecyclerView) r0.findViewById(R.id.recycler_view);
00750:         final CopyLicZoneBeanAdapter r3 = new CopyLicZoneBeanAdapter(this.devId);
00751:         r3.setList(this.haveCheckZones);
00752:         r2.setAdapter(r3);
00753:         r2.setLayoutManager(new LinearLayoutManager(this, 1, false));
00754:         ((DefaultItemAnimator) r2.getItemAnimator()).setSupportsChangeAnimations(false);
00755:         r0.findViewById(R.id.tv_zone_setting_cancel).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda2(r0));
00756:         r0.findViewById(R.id.tv_zone_setting_done).setOnClickListener(new Iic800AddPlanActivity$$ExternalSyntheticLambda3(this, r0, r3));
00757:     }
00758: 
00759:     static void lambda$showCopyZonesDialog$12(Dialog r0, View r1) {
00760:         r0.dismiss();
00761:     }
00762: 
00763:     private void lambda$showCopyZonesDialog$13(Dialog r1, CopyLicZoneBeanAdapter r2, View r3) {
00764:         r1.dismiss();
00765:         initDataViews(this.haveCheckZones.get(r2.getSelectIndex()));
00766:     }
00767: }
```


## `com.inkbird.inkbirdapp.device.iic800.bean.IicZoneBean`

Methods detected: `isAlarm, setAlarm, IicZoneBean, getZoneId, setZoneId, getName, setName, getRunTime, setRunTime, getStartTimeList, setStartTimeList, getScheduleMode, setScheduleMode, getScheduleDay, setScheduleDay, getIntervalYear, setIntervalYear, getIntervalMonth, setIntervalMonth, getIntervalDay, setIntervalDay, isSeaAdjSwitch, setSeaAdjSwitch, getNextTime, setNextTime, getAdjustValue, setAdjustValue, isTotalSeaSwitch, setTotalSeaSwitch, isWateringSwitch, setWateringSwitch, getWorkMode, setWorkMode, getRemainTime, setRemainTime, getWateredTime, setWateredTime, getManualMode, setManualMode, getManualTime, setManualTime, isEnable, setEnable, isWait, setWait, equals, if`

### Excerpt 1: lines 1–216

Reasons: IIC-800 structural marker, compact protocol-facing class.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.bean;
00002: 
00003: import java.io.Serializable;
00004: import java.util.List;
00005: 
00006: public class IicZoneBean implements Serializable {
00007:     private int adjustValue;
00008:     private boolean alarm;
00009:     private boolean enable;
00010:     private int intervalDay;
00011:     private int intervalMonth;
00012:     private int intervalYear;
00013:     private int manualMode;
00014:     private int manualTime;
00015:     private String name;
00016:     private long nextTime;
00017:     private int remainTime;
00018:     private int runTime;
00019:     private int scheduleDay;
00020:     private int scheduleMode;
00021:     private boolean seaAdjSwitch;
00022:     private List<StartTimeBean> startTimeList;
00023:     private boolean totalSeaSwitch;
00024:     private int wateredTime;
00025:     private String workMode;
00026:     private int zoneId;
00027:     private boolean wateringSwitch = false;
00028:     private boolean isWait = false;
00029: 
00030:     public boolean isAlarm() {
00031:         return this.alarm;
00032:     }
00033: 
00034:     public void setAlarm(boolean z) {
00035:         this.alarm = z;
00036:     }
00037: 
00038:     public IicZoneBean(int i2) {
00039:         this.zoneId = i2;
00040:     }
00041: 
00042:     public int getZoneId() {
00043:         return this.zoneId;
00044:     }
00045: 
00046:     public void setZoneId(int i2) {
00047:         this.zoneId = i2;
00048:     }
00049: 
00050:     public String getName() {
00051:         return this.name;
00052:     }
00053: 
00054:     public void setName(String str) {
00055:         this.name = str;
00056:     }
00057: 
00058:     public int getRunTime() {
00059:         return this.runTime;
00060:     }
00061: 
00062:     public void setRunTime(int i2) {
00063:         this.runTime = i2;
00064:     }
00065: 
00066:     public List<StartTimeBean> getStartTimeList() {
00067:         return this.startTimeList;
00068:     }
00069: 
00070:     public void setStartTimeList(List<StartTimeBean> list) {
00071:         this.startTimeList = list;
00072:     }
00073: 
00074:     public int getScheduleMode() {
00075:         return this.scheduleMode;
00076:     }
00077: 
00078:     public void setScheduleMode(int i2) {
00079:         this.scheduleMode = i2;
00080:     }
00081: 
00082:     public int getScheduleDay() {
00083:         return this.scheduleDay;
00084:     }
00085: 
00086:     public void setScheduleDay(int i2) {
00087:         this.scheduleDay = i2;
00088:     }
00089: 
00090:     public int getIntervalYear() {
00091:         return this.intervalYear;
00092:     }
00093: 
00094:     public void setIntervalYear(int i2) {
00095:         this.intervalYear = i2;
00096:     }
00097: 
00098:     public int getIntervalMonth() {
00099:         return this.intervalMonth;
00100:     }
00101: 
00102:     public void setIntervalMonth(int i2) {
00103:         this.intervalMonth = i2;
00104:     }
00105: 
00106:     public int getIntervalDay() {
00107:         return this.intervalDay;
00108:     }
00109: 
00110:     public void setIntervalDay(int i2) {
00111:         this.intervalDay = i2;
00112:     }
00113: 
00114:     public boolean isSeaAdjSwitch() {
00115:         return this.seaAdjSwitch;
00116:     }
00117: 
00118:     public void setSeaAdjSwitch(boolean z) {
00119:         this.seaAdjSwitch = z;
00120:     }
00121: 
00122:     public long getNextTime() {
00123:         return this.nextTime;
00124:     }
00125: 
00126:     public void setNextTime(long j2) {
00127:         this.nextTime = j2;
00128:     }
00129: 
00130:     public int getAdjustValue() {
00131:         return this.adjustValue;
00132:     }
00133: 
00134:     public void setAdjustValue(int i2) {
00135:         this.adjustValue = i2;
00136:     }
00137: 
00138:     public boolean isTotalSeaSwitch() {
00139:         return this.totalSeaSwitch;
00140:     }
00141: 
00142:     public void setTotalSeaSwitch(boolean z) {
00143:         this.totalSeaSwitch = z;
00144:     }
00145: 
00146:     public boolean isWateringSwitch() {
00147:         return this.wateringSwitch;
00148:     }
00149: 
00150:     public void setWateringSwitch(boolean z) {
00151:         this.wateringSwitch = z;
00152:     }
00153: 
00154:     public String getWorkMode() {
00155:         return this.workMode;
00156:     }
00157: 
00158:     public void setWorkMode(String str) {
00159:         this.workMode = str;
00160:     }
00161: 
00162:     public int getRemainTime() {
00163:         return this.remainTime;
00164:     }
00165: 
00166:     public void setRemainTime(int i2) {
00167:         this.remainTime = i2;
00168:     }
00169: 
00170:     public int getWateredTime() {
00171:         return this.wateredTime;
00172:     }
00173: 
00174:     public void setWateredTime(int i2) {
00175:         this.wateredTime = i2;
00176:     }
00177: 
00178:     public int getManualMode() {
00179:         return this.manualMode;
00180:     }
00181: 
00182:     public void setManualMode(int i2) {
00183:         this.manualMode = i2;
00184:     }
00185: 
00186:     public int getManualTime() {
00187:         return this.manualTime;
00188:     }
00189: 
00190:     public void setManualTime(int i2) {
00191:         this.manualTime = i2;
00192:     }
00193: 
00194:     public boolean isEnable() {
00195:         return this.enable;
00196:     }
00197: 
00198:     public void setEnable(boolean z) {
00199:         this.enable = z;
00200:     }
00201: 
00202:     public boolean isWait() {
00203:         return this.isWait;
00204:     }
00205: 
00206:     public void setWait(boolean z) {
00207:         this.isWait = z;
00208:     }
00209: 
00210:     public boolean equals(Object obj) {
00211:         if (obj instanceof IicZoneBean) {
00212:             return this.zoneId == ((IicZoneBean) obj).zoneId;
00213:         }
00214:         return super.equals(obj);
00215:     }
00216: }
```


## `com.inkbird.inkbirdapp.device.iic800.bean.IrrigationBean`

Methods detected: `getZoneId, setZoneId, isTurnOn, setTurnOn, getTime, setTime, getRunTime, setRunTime, getMode, setMode`

### Excerpt 1: lines 1–49

Reasons: IIC-800 structural marker, compact protocol-facing class.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.bean;
00002: 
00003: public class IrrigationBean {
00004:     private int mode;
00005:     private int runTime;
00006:     private long time;
00007:     private boolean turnOn = false;
00008:     private int zoneId;
00009: 
00010:     public int getZoneId() {
00011:         return this.zoneId;
00012:     }
00013: 
00014:     public void setZoneId(int i2) {
00015:         this.zoneId = i2;
00016:     }
00017: 
00018:     public boolean isTurnOn() {
00019:         return this.turnOn;
00020:     }
00021: 
00022:     public void setTurnOn(boolean z) {
00023:         this.turnOn = z;
00024:     }
00025: 
00026:     public long getTime() {
00027:         return this.time;
00028:     }
00029: 
00030:     public void setTime(long j2) {
00031:         this.time = j2;
00032:     }
00033: 
00034:     public int getRunTime() {
00035:         return this.runTime;
00036:     }
00037: 
00038:     public void setRunTime(int i2) {
00039:         this.runTime = i2;
00040:     }
00041: 
00042:     public int getMode() {
00043:         return this.mode;
00044:     }
00045: 
00046:     public void setMode(int i2) {
00047:         this.mode = i2;
00048:     }
00049: }
```


## `com.inkbird.inkbirdapp.device.iic800.bean.StartTimeBean`

Methods detected: `StartTimeBean, StartTimeBean, getHour, setHour, getMinute, setMinute, isAddBtn, setAddBtn, equals, if, if, if`

### Excerpt 1: lines 1–56

Reasons: compact protocol-facing class.

```java
00001: package com.inkbird.inkbirdapp.device.iic800.bean;
00002: 
00003: import java.io.Serializable;
00004: 
00005: public class StartTimeBean implements Serializable {
00006:     private int hour;
00007:     private boolean isAddBtn = true;
00008:     private int minute;
00009: 
00010:     public StartTimeBean() {
00011:     }
00012: 
00013:     public StartTimeBean(int i2, int i3) {
00014:         this.hour = i2;
00015:         this.minute = i3;
00016:     }
00017: 
00018:     public int getHour() {
00019:         return this.hour;
00020:     }
00021: 
00022:     public void setHour(int i2) {
00023:         this.isAddBtn = false;
00024:         this.hour = i2;
00025:     }
00026: 
00027:     public int getMinute() {
00028:         return this.minute;
00029:     }
00030: 
00031:     public void setMinute(int i2) {
00032:         this.isAddBtn = false;
00033:         this.minute = i2;
00034:     }
00035: 
00036:     public boolean isAddBtn() {
00037:         return this.isAddBtn;
00038:     }
00039: 
00040:     public void setAddBtn(boolean z) {
00041:         this.isAddBtn = z;
00042:     }
00043: 
00044:     public boolean equals(Object obj) {
00045:         if (this == obj) {
00046:             return true;
00047:         }
00048:         if (obj != null && getClass() == obj.getClass()) {
00049:             StartTimeBean startTimeBean = (StartTimeBean) obj;
00050:             if (this.hour == startTimeBean.hour && this.minute == startTimeBean.minute && this.isAddBtn == startTimeBean.isAddBtn) {
00051:                 return true;
00052:             }
00053:         }
00054:         return false;
00055:     }
00056: }
```
