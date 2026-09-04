# INKBIRD 2.1.11 — IIC-800 exact DEX bytecode evidence

> Generated with Android `apkanalyzer dex code`. Complete class bytecode is retained only in the workflow artifact; this report contains focused excerpts.

## Inventory

| class | lines | methods | retained methods | SHA-256 |
|---|---:|---:|---:|---|
| `IIic800Model` | 24 | 2 | 0 | `871e636af2418e6aa17b019756382416bbf1a65164b69ec9409a07c43cd80e13` |
| `Iic800AddPlanActivity` | 3412 | 48 | 0 | `529285c5a13910a375266b13fddcbcb956ed7270c167dd7b212716d9ad955398` |
| `Iic800AddPlanPresenter` | 940 | 17 | 3 | `1a8b2c0333ce4b87807aa9fe5041e44dbb1f8961a3959df6110fcb94542eec36` |
| `Iic800Constant` | 161 | 4 | 1 | `c2f665c5b85c38ac4c46092de81150aaa3b37c6dee8d99637d49972597618d90` |
| `Iic800ManualFragment` | 3263 | 71 | 0 | `72bd27ce31360ad0333d651d55fe08c7285ab9663c93fb088082d07901e9a5b1` |
| `Iic800ManualPresenter` | 1945 | 20 | 9 | `661f2a8d3b9d7709913ca1df6f59cde92aa605306330613459e648880d47495b` |
| `Iic800Model` | 1118 | 7 | 1 | `b777100bdaee56905d1534ab7ddc07e2f441a5838e17b44f807567e6527e0fe4` |
| `Iic800Presenter` | 1949 | 20 | 6 | `e4345ffe773c428f9cc8b17a1ff99cb8439f71656f0595ff5a90a56a89990897` |
| `Iic800SchedulePresenter` | 1800 | 18 | 7 | `b82e2df22ea5b3777a0fd8e3257c458c5c2e993f1f18644ce8f95bd77fdc983e` |
| `Iic800SettingsPresenter` | 840 | 22 | 8 | `edc5c04e53dce118c54c3f79b2561e6668b753de04526531d19d55b930caa3b8` |
| `IicZoneBean` | 533 | 46 | 0 | `9cb9f837a48b8842fa5ca6ac61f8cfd2889b1470b7eae1f5ecec84ee2f424a82` |
| `IrrigationBean` | 124 | 11 | 0 | `fd02f1e005a0a1c43a7fb148e4af5d50703e05138d4f4ea7fe7380848e2d8838` |
| `StartTimeBean` | 174 | 9 | 0 | `0ae6166ff749273599d4221a888ca4a16935dffe5d476ee5477014006334b840` |

## `Iic800AddPlanPresenter`

### 1. `parseIICZoneBean` — lines 315–551

Header: `.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;`

Evidence: protocol/transport/array markers; protocol-facing method name.

Excerpt 1:

```smali
00315: .method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
00316:     .registers 8
00317: 
00318:     .line 157
00319:     new-instance v0, Ljava/lang/StringBuilder;
00320: 
00321:     const/4 v1, 0x2
00322: 
00323:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00324: 
00325:     move-result-object p1
00326: 
00327:     invoke-direct {v0, p1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
00328: 
00329:     .line 158
00330:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I
00331: 
00332:     move-result p1
00333: 
00334:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00335: 
00336:     move-result-object p1
00337: 
00338:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00339: 
00340:     const/4 p1, 0x0
00341: 
00342:     move v2, p1
00343: 
00344:     .line 159
00345:     :goto_17
00346:     const-string v3, "FF"
00347: 
00348:     const/4 v4, 0x6
00349: 
00350:     if-ge v2, v4, :cond_42
00351: 
00352:     .line 160
00353:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00354: 
00355:     move-result-object v4
00356: 
00357:     invoke-interface {v4}, Ljava/util/List;->size()I
00358: 
00359:     move-result v4
00360: 
00361:     if-ge v2, v4, :cond_3c
00362: 
00363:     .line 161
00364:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00365: 
00366:     move-result-object v3
00367: 
00368:     invoke-interface {v3, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;
00369: 
00370:     move-result-object v3
00371: 
00372:     check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
00373: 
00374:     invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I
00375: 
00376:     move-result v3
00377: 
00378:     invoke-static {v3, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00379: 
00380:     move-result-object v3
00381: 
00382:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00383: 
00384:     goto :goto_3f
00385: 
00386:     .line 163
00387:     :cond_3c
00388:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00389: 
00390:     :goto_3f
00391:     add-int/lit8 v2, v2, 0x1
00392: 
00393:     goto :goto_17
00394: 
00395:     :cond_42
00396:     :goto_42
00397:     if-ge p1, v4, :cond_6a
00398: 
00399:     .line 167
00400:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00401: 
00402:     move-result-object v2
00403: 
00404:     invoke-interface {v2}, Ljava/util/List;->size()I
00405: 
00406:     move-result v2
00407: 
00408:     if-ge p1, v2, :cond_64
```

Excerpt 2:

```smali
00411:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00412: 
00413:     move-result-object v2
00414: 
00415:     invoke-interface {v2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;
00416: 
00417:     move-result-object v2
00418: 
00419:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
00420: 
00421:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I
00422: 
00423:     move-result v2
00424: 
00425:     invoke-static {v2, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00426: 
00427:     move-result-object v2
00428: 
00429:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00430: 
00431:     goto :goto_67
00432: 
00433:     .line 170
00434:     :cond_64
00435:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00436: 
00437:     :goto_67
00438:     add-int/lit8 p1, p1, 0x1
00439: 
00440:     goto :goto_42
00441: 
00442:     .line 173
00443:     :cond_6a
00444:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
00445: 
00446:     move-result p1
00447: 
00448:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00449: 
00450:     move-result-object p1
00451: 
00452:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00453: 
00454:     .line 174
00455:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
00456: 
00457:     move-result p1
00458: 
00459:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00460: 
00461:     move-result-object p1
00462: 
00463:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00464: 
00465:     .line 175
00466:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I
00467: 
00468:     move-result p1
00469: 
00470:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00471: 
00472:     move-result-object p1
00473: 
00474:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00475: 
00476:     .line 176
00477:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I
00478: 
00479:     move-result p1
00480: 
00481:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00482: 
00483:     move-result-object p1
00484: 
00485:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00486: 
00487:     .line 177
00488:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I
00489: 
00490:     move-result p1
00491: 
00492:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00493: 
00494:     move-result-object p1
00495: 
00496:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00497: 
00498:     .line 178
00499:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z
00500: 
00501:     move-result p1
00502: 
00503:     const-string v1, "1"
00504: 
00505:     const-string v2, "0"
00506: 
00507:     if-eqz p1, :cond_af
00508: 
00509:     .line 179
00510:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00511: 
00512:     goto :goto_b2
00513: 
00514:     .line 181
00515:     :cond_af
00516:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00517: 
00518:     .line 183
00519:     :goto_b2
00520:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z
00521: 
00522:     move-result p1
```

### 2. `reset` — lines 656–734

Header: `.method public reset()V`

Evidence: protocol/transport/array markers.

```smali
00656: .method public reset()V
00657:     .registers 5
00658: 
00659:     .line 68
00660:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00661: 
00662:     if-eqz v0, :cond_3f
00663: 
00664:     invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I
00665: 
00666:     move-result v0
00667: 
00668:     if-lez v0, :cond_3f
00669: 
00670:     .line 69
00671:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;
00672: 
00673:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00674: 
00675:     .line 70
00676:     new-instance v0, Ljava/lang/StringBuilder;
00677: 
00678:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
00679: 
00680:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00681: 
00682:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
00683: 
00684:     move-result v1
00685: 
00686:     const/4 v2, 0x1
00687: 
00688:     sub-int/2addr v1, v2
00689: 
00690:     shl-int v1, v2, v1
00691: 
00692:     const/4 v2, 0x2
00693: 
00694:     invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00695: 
00696:     move-result-object v1
00697: 
00698:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00699: 
00700:     move-result-object v0
00701: 
00702:     const-string v1, "00ffffffffffffffffffffffff007f15090101"
00703: 
00704:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00705: 
00706:     move-result-object v0
00707: 
00708:     invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00709: 
00710:     move-result-object v0
00711: 
00712:     .line 71
00713:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;
00714: 
00715:     invoke-static {v1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00716: 
00717:     move-result-object v1
00718: 
00719:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->resetCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00720: 
00721:     const-string v3, "38"
00722: 
00723:     invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00724: 
00725:     return-void
00726: 
00727:     .line 73
00728:     :cond_3f
00729:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;
00730: 
00731:     invoke-virtual {v0}, Landroid/app/Activity;->finish()V
00732: 
00733:     return-void
00734: .end method
```

### 3. `setPlan` — lines 736–922

Header: `.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

Excerpt 1:

```smali
00832: 
00833:     move-result v0
00834: 
00835:     sub-int/2addr v0, v2
00836: 
00837:     shl-int v0, v2, v0
00838: 
00839:     .line 91
00840:     invoke-direct {p0, v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
00841: 
00842:     move-result-object p1
00843: 
00844:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;
00845: 
00846:     invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00847: 
00848:     move-result-object v0
00849: 
00850:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00851: 
00852:     invoke-static {v1, p1, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00853: 
00854:     goto :goto_9c
00855: 
00856:     .line 93
00857:     :cond_67
00858:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->zoneNumbers:Ljava/util/List;
00859: 
00860:     if-eqz v0, :cond_9c
00861: 
00862:     invoke-interface {v0}, Ljava/util/List;->size()I
00863: 
00864:     move-result v0
00865: 
00866:     if-eqz v0, :cond_9c
00867: 
00868:     .line 95
00869:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->zoneNumbers:Ljava/util/List;
00870: 
00871:     invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;
00872: 
00873:     move-result-object v0
00874: 
00875:     const/4 v3, 0x0
00876: 
00877:     :goto_78
00878:     invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z
00879: 
00880:     move-result v4
00881: 
00882:     if-eqz v4, :cond_8d
```

Excerpt 2:

```smali
00897:     shl-int v4, v2, v4
00898: 
00899:     add-int/2addr v3, v4
00900: 
00901:     goto :goto_78
00902: 
00903:     .line 98
00904:     :cond_8d
00905:     invoke-direct {p0, v3, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
00906: 
00907:     move-result-object p1
00908: 
00909:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;
00910: 
00911:     invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00912: 
00913:     move-result-object v0
00914: 
00915:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00916: 
00917:     invoke-static {v1, p1, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00918: 
00919:     :cond_9c
00920:     :goto_9c
00921:     return-void
00922: .end method
```


## `Iic800Constant`

### 1. `<clinit>` — lines 33–110

Header: `.method static constructor <clinit>()V`

Evidence: protocol/transport/array markers.

```smali
00033: .method static constructor <clinit>()V
00034:     .registers 2
00035: 
00036:     .line 11
00037:     new-instance v0, Ljava/util/ArrayList;
00038: 
00039:     invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V
00040: 
00041:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->historyBeans:Ljava/util/List;
00042: 
00043:     .line 12
00044:     const-string v0, "IIC_800"
00045: 
00046:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
00047: 
00048:     .line 13
00049:     const-string v1, "IIC_400"
00050: 
00051:     sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_400:Ljava/lang/String;
00052: 
00053:     .line 14
00054:     const-string v1, "IIC_600"
00055: 
00056:     sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_600:Ljava/lang/String;
00057: 
00058:     .line 15
00059:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_800:Ljava/lang/String;
00060: 
00061:     .line 16
00062:     const-string v0, "IIC_801"
00063: 
00064:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_801:Ljava/lang/String;
00065: 
00066:     const/16 v0, 0x8
00067: 
00068:     .line 27
00069:     new-array v0, v0, [I
00070: 
00071:     fill-array-data v0, :array_2c
00072: 
00073:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->images:[I
00074: 
00075:     const/4 v0, 0x7
00076: 
00077:     .line 33
00078:     new-array v0, v0, [I
00079: 
00080:     fill-array-data v0, :array_40
00081: 
00082:     sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->weeks:[I
00083: 
00084:     return-void
00085: 
00086:     nop
00087: 
00088:     :array_2c
00089:     .array-data 4
00090:         0x7f100b20
00091:         0x7f100b21
00092:         0x7f100b22
00093:         0x7f100b23
00094:         0x7f100b24
00095:         0x7f100b25
00096:         0x7f100b26
00097:         0x7f100b28
00098:     .end array-data
00099: 
00100:     :array_40
00101:     .array-data 4
00102:         0x7f141c96
00103:         0x7f141c70
00104:         0x7f141ca5
00105:         0x7f141ca8
00106:         0x7f141c9b
00107:         0x7f141c68
00108:         0x7f141c8b
00109:     .end array-data
00110: .end method
```


## `Iic800ManualPresenter`

### 1. `<init>` — lines 29–73

Header: `.method public constructor <init>(Landroidx/fragment/app/Fragment;Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ManualView;)V`

Evidence: protocol/transport/array markers.

```smali
00029: .method public constructor <init>(Landroidx/fragment/app/Fragment;Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ManualView;)V
00030:     .registers 4
00031: 
00032:     .line 60
00033:     invoke-direct {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;-><init>()V
00034: 
00035:     .line 264
00036:     new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter$1;
00037: 
00038:     invoke-direct {v0, p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter$1;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;)V
00039: 
00040:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00041: 
00042:     .line 61
00043:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
00044: 
00045:     .line 62
00046:     iput-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ManualView;
00047: 
00048:     .line 63
00049:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getActivity()Landroidx/fragment/app/FragmentActivity;
00050: 
00051:     move-result-object p1
00052: 
00053:     invoke-virtual {p1}, Landroidx/fragment/app/FragmentActivity;->getIntent()Landroid/content/Intent;
00054: 
00055:     move-result-object p1
00056: 
00057:     const-string p2, "devId"
00058: 
00059:     invoke-virtual {p1, p2}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;
00060: 
00061:     move-result-object p1
00062: 
00063:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->devId:Ljava/lang/String;
00064: 
00065:     .line 64
00066:     invoke-static {p1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00067: 
00068:     move-result-object p1
00069: 
00070:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00071: 
00072:     return-void
00073: .end method
```

### 2. `changeAllManual` — lines 540–667

Header: `.method public changeAllManual(Ljava/util/List;I)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00540: .method public changeAllManual(Ljava/util/List;I)V
00541:     .registers 8
00542:     .annotation system Ldalvik/annotation/Signature;
00543:         value = {
00544:             "(",
00545:             "Ljava/util/List<",
00546:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
00547:             ">;I)V"
00548:         }
00549:     .end annotation
00550: 
00551:     .line 229
00552:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00553: 
00554:     if-eqz v0, :cond_69
00555: 
00556:     .line 230
00557:     new-instance v0, Ljava/lang/StringBuilder;
00558: 
00559:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
00560: 
00561:     .line 231
00562:     new-instance v1, Ljava/lang/StringBuilder;
00563: 
00564:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
00565: 
00566:     .line 232
00567:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
00568: 
00569:     move-result-object p1
00570: 
00571:     :goto_12
00572:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
00573: 
00574:     move-result v2
00575: 
00576:     if-eqz v2, :cond_44
00577: 
00578:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
00579: 
00580:     move-result-object v2
00581: 
00582:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00583: 
00584:     .line 233
00585:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWateringSwitch()Z
00586: 
00587:     move-result v3
00588: 
00589:     const/4 v4, 0x4
00590: 
00591:     if-eqz v3, :cond_2d
00592: 
00593:     .line 234
00594:     invoke-static {p2, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00595: 
00596:     move-result-object v3
00597: 
00598:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00599: 
00600:     goto :goto_38
00601: 
00602:     .line 236
00603:     :cond_2d
00604:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I
00605: 
00606:     move-result v3
00607: 
00608:     invoke-static {v3, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00609: 
00610:     move-result-object v3
00611: 
00612:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00613: 
00614:     .line 238
00615:     :goto_38
00616:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
00617: 
00618:     move-result v2
00619: 
00620:     invoke-static {v2, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00621: 
00622:     move-result-object v2
00623: 
00624:     invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00625: 
00626:     goto :goto_12
00627: 
00628:     .line 241
00629:     :cond_44
00630:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
00631: 
00632:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
00633: 
00634:     move-result-object p1
00635: 
00636:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00637: 
00638:     .line 242
00639:     new-instance p1, Ljava/lang/StringBuilder;
00640: 
00641:     const-string p2, "0200"
00642: 
00643:     invoke-direct {p1, p2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
00644: 
00645:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
00646: 
00647:     move-result-object p1
00648: 
00649:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
00650: 
00651:     move-result-object p1
00652: 
00653:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00654: 
00655:     move-result-object p1
00656: 
00657:     iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00658: 
00659:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00660: 
00661:     const-string v1, "45"
00662: 
00663:     invoke-static {v1, p1, p2, v0}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00664: 
00665:     :cond_69
00666:     return-void
00667: .end method
```

### 3. `changeManuals` — lines 669–778

Header: `.method public changeManuals(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00669: .method public changeManuals(Ljava/util/List;)V
00670:     .registers 7
00671:     .annotation system Ldalvik/annotation/Signature;
00672:         value = {
00673:             "(",
00674:             "Ljava/util/List<",
00675:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
00676:             ">;)V"
00677:         }
00678:     .end annotation
00679: 
00680:     .line 201
00681:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00682: 
00683:     if-eqz v0, :cond_5b
00684: 
00685:     .line 202
00686:     new-instance v0, Ljava/lang/StringBuilder;
00687: 
00688:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
00689: 
00690:     .line 203
00691:     new-instance v1, Ljava/lang/StringBuilder;
00692: 
00693:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
00694: 
00695:     .line 204
00696:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
00697: 
00698:     move-result-object p1
00699: 
00700:     :goto_12
00701:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
00702: 
00703:     move-result v2
00704: 
00705:     if-eqz v2, :cond_36
00706: 
00707:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
00708: 
00709:     move-result-object v2
00710: 
00711:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00712: 
00713:     .line 205
00714:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getManualTime()I
00715: 
00716:     move-result v3
00717: 
00718:     const/4 v4, 0x4
00719: 
00720:     invoke-static {v3, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00721: 
00722:     move-result-object v3
00723: 
00724:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00725: 
00726:     .line 206
00727:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
00728: 
00729:     move-result v2
00730: 
00731:     invoke-static {v2, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00732: 
00733:     move-result-object v2
00734: 
00735:     invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00736: 
00737:     goto :goto_12
00738: 
00739:     .line 209
00740:     :cond_36
00741:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
00742: 
00743:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
00744: 
00745:     move-result-object p1
00746: 
00747:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00748: 
00749:     .line 210
00750:     new-instance p1, Ljava/lang/StringBuilder;
00751: 
00752:     const-string v2, "0201"
00753: 
00754:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
00755: 
00756:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
00757: 
00758:     move-result-object p1
00759: 
00760:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
00761: 
00762:     move-result-object p1
00763: 
00764:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00765: 
00766:     move-result-object p1
00767: 
00768:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00769: 
00770:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00771: 
00772:     const-string v2, "45"
00773: 
00774:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00775: 
00776:     :cond_5b
00777:     return-void
00778: .end method
```

### 4. `onDestroy` — lines 1114–1130

Header: `.method public onDestroy()V`

Evidence: protocol/transport/array markers.

```smali
01114: .method public onDestroy()V
01115:     .registers 2
01116: 
01117:     .line 69
01118:     invoke-super {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;->onDestroy()V
01119: 
01120:     .line 70
01121:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01122: 
01123:     if-eqz v0, :cond_a
01124: 
01125:     .line 71
01126:     invoke-interface {v0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->onDestroy()V
01127: 
01128:     :cond_a
01129:     return-void
01130: .end method
```

### 5. `startAllManual` — lines 1291–1379

Header: `.method public startAllManual(I)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01291: .method public startAllManual(I)V
01292:     .registers 8
01293: 
01294:     .line 215
01295:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01296: 
01297:     if-eqz v0, :cond_4d
01298: 
01299:     if-lez p1, :cond_4d
01300: 
01301:     .line 216
01302:     new-instance v0, Ljava/lang/StringBuilder;
01303: 
01304:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01305: 
01306:     .line 217
01307:     new-instance v1, Ljava/lang/StringBuilder;
01308: 
01309:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01310: 
01311:     const/4 v2, 0x0
01312: 
01313:     move v3, v2
01314: 
01315:     :goto_12
01316:     const/16 v4, 0x8
01317: 
01318:     if-ge v3, v4, :cond_28
01319: 
01320:     const/4 v4, 0x4
01321: 
01322:     .line 219
01323:     invoke-static {p1, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01324: 
01325:     move-result-object v5
01326: 
01327:     invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01328: 
01329:     .line 220
01330:     invoke-static {v2, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01331: 
01332:     move-result-object v4
01333: 
01334:     invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01335: 
01336:     add-int/lit8 v3, v3, 0x1
01337: 
01338:     goto :goto_12
01339: 
01340:     .line 223
01341:     :cond_28
01342:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01343: 
01344:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01345: 
01346:     move-result-object p1
01347: 
01348:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01349: 
01350:     .line 224
01351:     new-instance p1, Ljava/lang/StringBuilder;
01352: 
01353:     const-string v2, "0100"
01354: 
01355:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01356: 
01357:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01358: 
01359:     move-result-object p1
01360: 
01361:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01362: 
01363:     move-result-object p1
01364: 
01365:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01366: 
01367:     move-result-object p1
01368: 
01369:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01370: 
01371:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01372: 
01373:     const-string v2, "45"
01374: 
01375:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01376: 
01377:     :cond_4d
01378:     return-void
01379: .end method
```

### 6. `startManuals` — lines 1381–1556

Header: `.method public startManuals(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01381: .method public startManuals(Ljava/util/List;)V
01382:     .registers 7
01383:     .annotation system Ldalvik/annotation/Signature;
01384:         value = {
01385:             "(",
01386:             "Ljava/util/List<",
01387:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
01388:             ">;)V"
01389:         }
01390:     .end annotation
01391: 
01392:     .line 155
01393:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01394: 
01395:     if-eqz v0, :cond_9b
01396: 
01397:     .line 156
01398:     invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->getPowerStatus()Z
01399: 
01400:     move-result v0
01401: 
01402:     if-nez v0, :cond_2c
01403: 
01404:     .line 157
01405:     invoke-static {}, Lcom/inkbird/inkbirdapp/base/widget/popwindow/PopWindowUtil;->getInstance()Lcom/inkbird/inkbirdapp/base/widget/popwindow/PopWindowUtil;
01406: 
01407:     move-result-object p1
01408: 
01409:     invoke-static {}, Lcom/inkbird/base/utils/ActivityManager;->getAppManager()Lcom/inkbird/base/utils/ActivityManager;
01410: 
01411:     move-result-object v0
01412: 
01413:     invoke-virtual {v0}, Lcom/inkbird/base/utils/ActivityManager;->currentActivity()Landroid/app/Activity;
01414: 
01415:     move-result-object v0
01416: 
01417:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01418: 
01419:     const v2, 0x7f141ca4
01420: 
01421:     .line 158
01422:     invoke-virtual {v1, v2}, Landroidx/fragment/app/Fragment;->getString(I)Ljava/lang/String;
01423: 
01424:     move-result-object v1
01425: 
01426:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01427: 
01428:     const v3, 0x7f141ba3
01429: 
01430:     invoke-virtual {v2, v3}, Landroidx/fragment/app/Fragment;->getString(I)Ljava/lang/String;
01431: 
01432:     move-result-object v2
01433: 
01434:     .line 157
01435:     invoke-virtual {p1, v0, v1, v2}, Lcom/inkbird/inkbirdapp/base/widget/popwindow/PopWindowUtil;->showTips(Landroid/app/Activity;Ljava/lang/String;Ljava/lang/String;)V
01436: 
01437:     return-void
01438: 
01439:     .line 161
01440:     :cond_2c
01441:     new-instance v0, Ljava/lang/StringBuilder;
01442: 
01443:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01444: 
01445:     .line 162
01446:     new-instance v1, Ljava/lang/StringBuilder;
01447: 
01448:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01449: 
01450:     .line 163
01451:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01452: 
01453:     move-result-object p1
01454: 
01455:     :goto_3a
01456:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
01457: 
01458:     move-result v2
01459: 
01460:     if-eqz v2, :cond_5e
01461: 
01462:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01463: 
01464:     move-result-object v2
01465: 
01466:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01467: 
01468:     .line 164
01469:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getManualTime()I
01470: 
01471:     move-result v3
01472: 
01473:     const/4 v4, 0x4
01474: 
01475:     invoke-static {v3, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01476: 
01477:     move-result-object v3
01478: 
01479:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01480: 
01481:     .line 165
01482:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
01483: 
01484:     move-result v2
01485: 
01486:     invoke-static {v2, v4}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01487: 
01488:     move-result-object v2
01489: 
01490:     invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01491: 
01492:     goto :goto_3a
01493: 
01494:     .line 168
01495:     :cond_5e
01496:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01497: 
01498:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->requireContext()Landroid/content/Context;
01499: 
01500:     move-result-object p1
01501: 
01502:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01503: 
01504:     .line 169
01505:     new-instance p1, Ljava/lang/StringBuilder;
01506: 
01507:     const-string v2, "0101"
01508: 
01509:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01510: 
01511:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01512: 
01513:     move-result-object p1
01514: 
01515:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01516: 
01517:     move-result-object p1
01518: 
01519:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01520: 
01521:     move-result-object p1
01522: 
01523:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01524: 
01525:     iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01526: 
01527:     const-string v4, "45"
01528: 
01529:     invoke-static {v4, p1, v2, v3}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01530: 
01531:     .line 170
01532:     new-instance p1, Ljava/lang/StringBuilder;
01533: 
01534:     const-string v2, "-------0101"
01535: 
01536:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01537: 
01538:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01539: 
01540:     move-result-object p1
01541: 
01542:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01543: 
01544:     move-result-object p1
01545: 
01546:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01547: 
01548:     move-result-object p1
01549: 
01550:     const-string v0, "45dp:"
01551: 
01552:     invoke-static {v0, p1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I
01553: 
01554:     :cond_9b
01555:     return-void
01556: .end method
```

### 7. `startManuals2` — lines 1558–1703

Header: `.method public startManuals2(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01558: .method public startManuals2(Ljava/util/List;)V
01559:     .registers 9
01560:     .annotation system Ldalvik/annotation/Signature;
01561:         value = {
01562:             "(",
01563:             "Ljava/util/List<",
01564:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
01565:             ">;)V"
01566:         }
01567:     .end annotation
01568: 
01569:     .line 175
01570:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01571: 
01572:     if-eqz v0, :cond_78
01573: 
01574:     .line 176
01575:     new-instance v0, Ljava/lang/StringBuilder;
01576: 
01577:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01578: 
01579:     .line 177
01580:     new-instance v1, Ljava/lang/StringBuilder;
01581: 
01582:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01583: 
01584:     const/4 v2, 0x1
01585: 
01586:     :goto_f
01587:     const/16 v3, 0x9
01588: 
01589:     if-ge v2, v3, :cond_53
01590: 
01591:     .line 181
01592:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01593: 
01594:     move-result-object v3
01595: 
01596:     :cond_17
01597:     invoke-interface {v3}, Ljava/util/Iterator;->hasNext()Z
01598: 
01599:     move-result v4
01600: 
01601:     const/4 v5, 0x4
01602: 
01603:     if-eqz v4, :cond_41
01604: 
01605:     invoke-interface {v3}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01606: 
01607:     move-result-object v4
01608: 
01609:     check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01610: 
01611:     .line 182
01612:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
01613: 
01614:     move-result v6
01615: 
01616:     if-ne v6, v2, :cond_17
01617: 
01618:     .line 183
01619:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getManualTime()I
01620: 
01621:     move-result v3
01622: 
01623:     invoke-static {v3, v5}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01624: 
01625:     move-result-object v3
01626: 
01627:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01628: 
01629:     .line 184
01630:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
01631: 
01632:     move-result v3
01633: 
01634:     invoke-static {v3, v5}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01635: 
01636:     move-result-object v3
01637: 
01638:     invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01639: 
01640:     goto :goto_50
01641: 
01642:     :cond_41
01643:     const/4 v3, 0x0
01644: 
01645:     .line 190
01646:     invoke-static {v3, v5}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01647: 
01648:     move-result-object v4
01649: 
01650:     invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01651: 
01652:     .line 191
01653:     invoke-static {v3, v5}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01654: 
01655:     move-result-object v3
01656: 
01657:     invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01658: 
01659:     :goto_50
01660:     add-int/lit8 v2, v2, 0x1
01661: 
01662:     goto :goto_f
01663: 
01664:     .line 195
01665:     :cond_53
01666:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01667: 
01668:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01669: 
01670:     move-result-object p1
01671: 
01672:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01673: 
01674:     .line 196
01675:     new-instance p1, Ljava/lang/StringBuilder;
01676: 
01677:     const-string v2, "0101"
01678: 
01679:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01680: 
01681:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01682: 
01683:     move-result-object p1
01684: 
01685:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01686: 
01687:     move-result-object p1
01688: 
01689:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01690: 
01691:     move-result-object p1
01692: 
01693:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01694: 
01695:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01696: 
01697:     const-string v2, "45"
01698: 
01699:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01700: 
01701:     :cond_78
01702:     return-void
01703: .end method
```

### 8. `stopAllManual` — lines 1705–1781

Header: `.method public stopAllManual()V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01705: .method public stopAllManual()V
01706:     .registers 5
01707: 
01708:     .line 142
01709:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01710: 
01711:     if-eqz v0, :cond_40
01712: 
01713:     .line 143
01714:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01715: 
01716:     invoke-virtual {v0}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01717: 
01718:     move-result-object v0
01719: 
01720:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01721: 
01722:     .line 144
01723:     sget-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
01724: 
01725:     sget-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_400:Ljava/lang/String;
01726: 
01727:     invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
01728: 
01729:     move-result v0
01730: 
01731:     const-string v1, "45"
01732: 
01733:     if-eqz v0, :cond_23
01734: 
01735:     .line 145
01736:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01737: 
01738:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01739: 
01740:     const-string v3, "010000000000000000000000000000000000"
01741: 
01742:     invoke-static {v1, v3, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01743: 
01744:     return-void
01745: 
01746:     .line 146
01747:     :cond_23
01748:     sget-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
01749: 
01750:     sget-object v2, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_600:Ljava/lang/String;
01751: 
01752:     invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
01753: 
01754:     move-result v0
01755: 
01756:     if-eqz v0, :cond_37
01757: 
01758:     .line 147
01759:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01760: 
01761:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01762: 
01763:     const-string v3, "0100000000000000000000000000000000000000000000000000"
01764: 
01765:     invoke-static {v1, v3, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01766: 
01767:     return-void
01768: 
01769:     .line 149
01770:     :cond_37
01771:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01772: 
01773:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01774: 
01775:     const-string v3, "01000000000000000000000000000000000000000000000000000000000000000000"
01776: 
01777:     invoke-static {v1, v3, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01778: 
01779:     :cond_40
01780:     return-void
01781: .end method
```

### 9. `stopManual` — lines 1783–1944

Header: `.method public stopManual(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01783: .method public stopManual(Ljava/util/List;)V
01784:     .registers 10
01785:     .annotation system Ldalvik/annotation/Signature;
01786:         value = {
01787:             "(",
01788:             "Ljava/util/List<",
01789:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
01790:             ">;)V"
01791:         }
01792:     .end annotation
01793: 
01794:     .line 117
01795:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01796: 
01797:     if-eqz v0, :cond_84
01798: 
01799:     .line 118
01800:     new-instance v0, Ljava/lang/StringBuilder;
01801: 
01802:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01803: 
01804:     .line 119
01805:     new-instance v1, Ljava/lang/StringBuilder;
01806: 
01807:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01808: 
01809:     .line 122
01810:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01811: 
01812:     move-result-object p1
01813: 
01814:     const/4 v2, 0x0
01815: 
01816:     move v3, v2
01817: 
01818:     move v4, v3
01819: 
01820:     :goto_15
01821:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
01822: 
01823:     move-result v5
01824: 
01825:     if-eqz v5, :cond_54
01826: 
01827:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01828: 
01829:     move-result-object v4
01830: 
01831:     check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01832: 
01833:     .line 123
01834:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getManualMode()I
01835: 
01836:     move-result v5
01837: 
01838:     .line 124
01839:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWateringSwitch()Z
01840: 
01841:     move-result v6
01842: 
01843:     const/4 v7, 0x4
01844: 
01845:     if-eqz v6, :cond_3c
01846: 
01847:     .line 126
01848:     invoke-static {v2, v7}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01849: 
01850:     move-result-object v3
01851: 
01852:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01853: 
01854:     .line 127
01855:     invoke-static {v2, v7}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01856: 
01857:     move-result-object v3
01858: 
01859:     invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01860: 
01861:     const/4 v3, 0x1
01862: 
01863:     goto :goto_52
01864: 
01865:     .line 129
01866:     :cond_3c
01867:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I
01868: 
01869:     move-result v6
01870: 
01871:     invoke-static {v6, v7}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01872: 
01873:     move-result-object v6
01874: 
01875:     invoke-virtual {v0, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01876: 
01877:     .line 130
01878:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
01879: 
01880:     move-result v4
01881: 
01882:     invoke-static {v4, v7}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01883: 
01884:     move-result-object v4
01885: 
01886:     invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01887: 
01888:     :goto_52
01889:     move v4, v5
01890: 
01891:     goto :goto_15
01892: 
01893:     :cond_54
01894:     if-eqz v3, :cond_84
01895: 
01896:     .line 135
01897:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mContext:Landroidx/fragment/app/Fragment;
01898: 
01899:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01900: 
01901:     move-result-object p1
01902: 
01903:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01904: 
01905:     .line 136
01906:     new-instance p1, Ljava/lang/StringBuilder;
01907: 
01908:     const-string v2, "01"
01909: 
01910:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01911: 
01912:     const/4 v2, 0x2
01913: 
01914:     invoke-static {v4, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01915: 
01916:     move-result-object v2
01917: 
01918:     invoke-virtual {p1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01919: 
01920:     move-result-object p1
01921: 
01922:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01923: 
01924:     move-result-object p1
01925: 
01926:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01927: 
01928:     move-result-object p1
01929: 
01930:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01931: 
01932:     move-result-object p1
01933: 
01934:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01935: 
01936:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800ManualPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01937: 
01938:     const-string v2, "45"
01939: 
01940:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01941: 
01942:     :cond_84
01943:     return-void
01944: .end method
```


## `Iic800Model`

### 1. `parseZoneInfo` — lines 498–1021

Header: `.method public parseZoneInfo(Ljava/util/List;Ljava/lang/Object;Lcom/thingclips/smart/sdk/bean/DeviceBean;)Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;`

Evidence: DP constants 38; protocol/transport/array markers; protocol-facing method name.

```smali
00756:     invoke-virtual {v1, v3, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00757: 
00758:     move-result-object v3
00759: 
00760:     invoke-static {v3, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00761: 
00762:     move-result-object v3
00763: 
00764:     invoke-virtual {v3}, Ljava/lang/Integer;->intValue()I
00765: 
00766:     move-result v3
00767: 
00768:     invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalMonth(I)V
00769: 
00770:     const/16 v3, 0x26
00771: 
00772:     .line 63
00773:     invoke-virtual {v1, v5, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00774: 
00775:     move-result-object v5
00776: 
00777:     invoke-static {v5, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00778: 
00779:     move-result-object v5
00780: 
00781:     invoke-virtual {v5}, Ljava/lang/Integer;->intValue()I
00782: 
00783:     move-result v5
00784: 
00785:     invoke-virtual {v0, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalDay(I)V
00786: 
00787:     const/16 v5, 0x27
00788: 
00789:     .line 64
00790:     invoke-virtual {v1, v3, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00791: 
00792:     move-result-object v3
00793: 
00794:     invoke-static {v3, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00795: 
00796:     move-result-object v3
00797: 
00798:     invoke-virtual {v3}, Ljava/lang/Integer;->intValue()I
00799: 
00800:     move-result v3
```


## `Iic800Presenter`

### 1. `-$$Nest$fgetmDevice` — lines 64–70

Header: `.method static bridge synthetic -$$Nest$fgetmDevice(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;)Lcom/thingclips/smart/sdk/api/IThingDevice;`

Evidence: protocol/transport/array markers.

```smali
00064: .method static bridge synthetic -$$Nest$fgetmDevice(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00065:     .registers 1
00066: 
00067:     iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00068: 
00069:     return-object p0
00070: .end method
```

### 2. `initData` — lines 195–544

Header: `.method private initData()V`

Evidence: protocol/transport/array markers.

```smali
00330:     sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
00331: 
00332:     goto :goto_79
00333: 
00334:     .line 75
00335:     :cond_75
00336:     sget-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_800:Ljava/lang/String;
00337: 
00338:     sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
00339: 
00340:     .line 77
00341:     :goto_79
00342:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->devId:Ljava/lang/String;
00343: 
00344:     invoke-static {v1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00345: 
00346:     move-result-object v1
00347: 
00348:     iput-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00349: 
00350:     if-eqz v1, :cond_86
00351: 
00352:     .line 80
00353:     invoke-interface {v1, p0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->registerDevListener(Lcom/thingclips/smart/sdk/api/IDevListener;)V
00354: 
00355:     :cond_86
00356:     const/4 v1, 0x0
00357: 
00358:     if-eqz v0, :cond_cd
00359: 
00360:     .line 84
00361:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;
00362: 
00363:     invoke-virtual {v0}, Lcom/thingclips/smart/sdk/bean/DeviceBean;->getName()Ljava/lang/String;
00364: 
00365:     move-result-object v3
00366: 
00367:     invoke-interface {v2, v3}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;->setDeviceName(Ljava/lang/String;)V
00368: 
00369:     .line 85
00370:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;
00371: 
00372:     invoke-virtual {v0}, Lcom/thingclips/smart/sdk/bean/DeviceBean;->getIsOnline()Ljava/lang/Boolean;
00373: 
00374:     move-result-object v3
00375: 
00376:     invoke-interface {v2, v3}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;->setOnlineState(Ljava/lang/Boolean;)V
00377: 
00378:     .line 86
00379:     invoke-virtual {v0}, Lcom/thingclips/smart/sdk/bean/DeviceBean;->getDps()Ljava/util/Map;
00380: 
00381:     move-result-object v0
00382: 
00383:     if-eqz v0, :cond_cd
```

### 3. `initNormalTime` — lines 546–559

Header: `.method private initNormalTime()V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00546: .method private initNormalTime()V
00547:     .registers 4
00548: 
00549:     .line 173
00550:     const-string v0, "0000000000000000000000000000000000000000"
00551: 
00552:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00553: 
00554:     const-string v2, "38"
00555: 
00556:     invoke-static {v2, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;)V
00557: 
00558:     return-void
00559: .end method
```

### 4. `clearAlarm` — lines 730–754

Header: `.method public clearAlarm()V`

Evidence: protocol/transport/array markers.

```smali
00730: .method public clearAlarm()V
00731:     .registers 5
00732: 
00733:     .line 235
00734:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mContext:Landroid/app/Activity;
00735: 
00736:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00737: 
00738:     const/4 v0, 0x1
00739: 
00740:     .line 236
00741:     invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;
00742: 
00743:     move-result-object v0
00744: 
00745:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00746: 
00747:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00748: 
00749:     const-string v3, "109"
00750: 
00751:     invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00752: 
00753:     return-void
00754: .end method
```

### 5. `onDestroy` — lines 798–821

Header: `.method public onDestroy()V`

Evidence: protocol/transport/array markers.

```smali
00798: .method public onDestroy()V
00799:     .registers 2
00800: 
00801:     .line 122
00802:     invoke-super {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;->onDestroy()V
00803: 
00804:     .line 123
00805:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
00806: 
00807:     move-result-object v0
00808: 
00809:     invoke-virtual {v0, p0}, Lcom/thingclips/sdk/eventbus/EventBus;->unregister(Ljava/lang/Object;)V
00810: 
00811:     .line 124
00812:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00813: 
00814:     if-eqz v0, :cond_11
00815: 
00816:     .line 125
00817:     invoke-interface {v0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->unRegisterDevListener()V
00818: 
00819:     :cond_11
00820:     return-void
00821: .end method
```

### 6. `onDpUpdate` — lines 859–1887

Header: `.method public onDpUpdate(Ljava/lang/String;Ljava/lang/String;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

Excerpt 1:

```smali
00872:     move-result v0
00873: 
00874:     if-eqz v0, :cond_35b
00875: 
00876:     .line 247
00877:     invoke-static {}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->getDataInstance()Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;
00878: 
00879:     move-result-object v0
00880: 
00881:     invoke-interface {v0, p1}, Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;->getDeviceBean(Ljava/lang/String;)Lcom/thingclips/smart/sdk/bean/DeviceBean;
00882: 
00883:     move-result-object p1
00884: 
00885:     .line 248
00886:     invoke-static {p2}, Lcom/alibaba/fastjson/JSON;->parseObject(Ljava/lang/String;)Lcom/alibaba/fastjson/JSONObject;
00887: 
00888:     move-result-object p2
00889: 
00890:     .line 249
00891:     const-string v0, "38"
00892: 
00893:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
00894: 
00895:     move-result v1
00896: 
00897:     if-eqz v1, :cond_6a
00898: 
00899:     .line 250
00900:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
00901: 
00902:     move-result-object v0
00903: 
00904:     if-eqz v0, :cond_6a
00905: 
00906:     .line 251
00907:     const-string v1, "0000000000000000000000000000000000000000"
00908: 
00909:     invoke-virtual {v0}, Ljava/lang/Object;->toString()Ljava/lang/String;
00910: 
00911:     move-result-object v2
00912: 
00913:     invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
00914: 
00915:     move-result v1
00916: 
00917:     if-nez v1, :cond_6a
00918: 
00919:     .line 252
00920:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;
00921: 
00922:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
00923: 
00924:     invoke-virtual {v1, v2, v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->parseZoneInfo(Ljava/util/List;Ljava/lang/Object;Lcom/thingclips/smart/sdk/bean/DeviceBean;)Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00925: 
00926:     move-result-object v0
00927: 
00928:     .line 253
00929:     invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
00930: 
```

Excerpt 2:

```smali
00969: 
00970:     .line 256
00971:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
00972: 
00973:     move-result-object v2
00974: 
00975:     invoke-virtual {v2, v1}, Lcom/thingclips/sdk/eventbus/EventBus;->post(Ljava/lang/Object;)V
00976: 
00977:     goto :goto_56
00978: 
00979:     .line 262
00980:     :cond_6a
00981:     const-string v0, "45"
00982: 
00983:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
00984: 
00985:     move-result v1
00986: 
00987:     const/4 v2, 0x2
00988: 
00989:     const/16 v3, 0x10
00990: 
00991:     const/4 v4, 0x1
00992: 
00993:     const/4 v5, 0x4
00994: 
00995:     if-eqz v1, :cond_13a
00996: 
00997:     .line 263
00998:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
00999: 
01000:     move-result-object v0
01001: 
01002:     if-eqz v0, :cond_82
01003: 
01004:     .line 264
01005:     invoke-virtual {v0}, Ljava/lang/Object;->toString()Ljava/lang/String;
01006: 
01007:     move-result-object v0
01008: 
01009:     goto :goto_84
01010: 
01011:     :cond_82
01012:     const-string v0, "00000000000000000000000000000000000000000000000000000000000000000000"
01013: 
01014:     .line 265
01015:     :goto_84
01016:     invoke-virtual {v0, v2, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;
01017: 
01018:     move-result-object v1
01019: 
01020:     invoke-static {v1, v3}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
01021: 
01022:     move-result-object v1
01023: 
01024:     invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I
01025: 
01026:     move-result v1
01027: 
01028:     .line 266
```

Excerpt 3:

```smali
01212:     .line 277
01213:     :goto_131
01214:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
01215: 
01216:     move-result-object v8
01217: 
01218:     invoke-virtual {v8, v7}, Lcom/thingclips/sdk/eventbus/EventBus;->post(Ljava/lang/Object;)V
01219: 
01220:     goto/16 :goto_9a
01221: 
01222:     .line 281
01223:     :cond_13a
01224:     const-string v0, "101"
01225: 
01226:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01227: 
01228:     move-result v1
01229: 
01230:     const-string v6, "Auto"
01231: 
01232:     const-string v7, "OFF"
01233: 
01234:     const/4 v8, 0x0
01235: 
01236:     if-eqz v1, :cond_17b
01237: 
01238:     .line 282
01239:     invoke-virtual {p2, v0}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01240: 
01241:     move-result-object v1
01242: 
01243:     if-eqz v1, :cond_152
01244: 
01245:     .line 283
01246:     invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;
01247: 
01248:     move-result-object v1
01249: 
01250:     goto :goto_153
01251: 
01252:     :cond_152
01253:     move-object v1, v7
01254: 
01255:     .line 284
01256:     :goto_153
01257:     iget-object v9, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01258: 
01259:     invoke-interface {v9}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01260: 
01261:     move-result-object v9
01262: 
01263:     :cond_159
01264:     :goto_159
01265:     invoke-interface {v9}, Ljava/util/Iterator;->hasNext()Z
01266: 
01267:     move-result v10
01268: 
01269:     if-eqz v10, :cond_178
```

Excerpt 4:

```smali
01293:     .line 287
01294:     :cond_174
01295:     invoke-virtual {v10, v8}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setManualTime(I)V
01296: 
01297:     goto :goto_159
01298: 
01299:     .line 290
01300:     :cond_178
01301:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->updateNextTime()V
01302: 
01303:     .line 293
01304:     :cond_17b
01305:     const-string v1, "102"
01306: 
01307:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01308: 
01309:     move-result v9
01310: 
01311:     if-eqz v9, :cond_1b1
01312: 
01313:     .line 294
01314:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01315: 
01316:     move-result-object v1
01317: 
01318:     if-eqz v1, :cond_193
01319: 
01320:     .line 295
01321:     check-cast v1, Ljava/lang/Boolean;
01322: 
01323:     invoke-virtual {v1}, Ljava/lang/Boolean;->booleanValue()Z
01324: 
01325:     move-result v1
01326: 
01327:     if-eqz v1, :cond_193
01328: 
01329:     move v1, v4
01330: 
01331:     goto :goto_194
01332: 
01333:     :cond_193
01334:     move v1, v8
01335: 
01336:     .line 296
01337:     :goto_194
01338:     iget-object v9, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01339: 
01340:     invoke-interface {v9}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01341: 
01342:     move-result-object v9
01343: 
01344:     :goto_19a
```

Excerpt 5:

```smali
01359: 
01360:     .line 298
01361:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
01362: 
01363:     move-result-object v11
01364: 
01365:     invoke-virtual {v11, v10}, Lcom/thingclips/sdk/eventbus/EventBus;->post(Ljava/lang/Object;)V
01366: 
01367:     goto :goto_19a
01368: 
01369:     .line 302
01370:     :cond_1b1
01371:     const-string v1, "103"
01372: 
01373:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01374: 
01375:     move-result v9
01376: 
01377:     if-eqz v9, :cond_1e4
01378: 
01379:     .line 303
01380:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01381: 
01382:     move-result-object v1
01383: 
01384:     if-eqz v1, :cond_1c6
01385: 
01386:     .line 304
01387:     check-cast v1, Ljava/lang/Integer;
01388: 
01389:     invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I
01390: 
01391:     move-result v1
01392: 
01393:     goto :goto_1c7
01394: 
01395:     :cond_1c6
01396:     move v1, v8
01397: 
01398:     .line 305
01399:     :goto_1c7
01400:     iget-object v9, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01401: 
01402:     invoke-interface {v9}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01403: 
01404:     move-result-object v9
01405: 
01406:     :goto_1cd
01407:     invoke-interface {v9}, Ljava/util/Iterator;->hasNext()Z
01408: 
01409:     move-result v10
01410: 
```

Excerpt 6:

```smali
01421: 
01422:     .line 307
01423:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
01424: 
01425:     move-result-object v11
01426: 
01427:     invoke-virtual {v11, v10}, Lcom/thingclips/sdk/eventbus/EventBus;->post(Ljava/lang/Object;)V
01428: 
01429:     goto :goto_1cd
01430: 
01431:     .line 311
01432:     :cond_1e4
01433:     const-string v1, "104"
01434: 
01435:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01436: 
01437:     move-result v9
01438: 
01439:     if-eqz v9, :cond_27d
01440: 
01441:     .line 312
01442:     invoke-virtual {p2, v1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01443: 
01444:     move-result-object v1
01445: 
01446:     if-eqz v1, :cond_1f9
01447: 
01448:     .line 313
01449:     check-cast v1, Ljava/lang/Integer;
01450: 
01451:     invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I
01452: 
01453:     move-result v1
01454: 
01455:     goto :goto_1fa
01456: 
01457:     :cond_1f9
01458:     move v1, v8
01459: 
01460:     :goto_1fa
01461:     const/16 v9, 0x8
01462: 
01463:     .line 314
01464:     invoke-static {v1, v9}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01465: 
01466:     move-result-object v1
01467: 
01468:     .line 315
01469:     const-string v9, "1"
01470: 
01471:     invoke-virtual {v1, v4, v2}, Ljava/lang/String;->substring(II)Ljava/lang/String;
01472: 
01473:     move-result-object v10
01474: 
01475:     invoke-virtual {v9, v10}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
01476: 
01477:     move-result v9
01478: 
01479:     const/4 v10, 0x3
01480: 
01481:     .line 316
01482:     invoke-virtual {v1, v2, v10}, Ljava/lang/String;->substring(II)Ljava/lang/String;
01483: 
01484:     move-result-object v11
01485: 
01486:     invoke-static {v11, v3}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;I)I
01487: 
01488:     move-result v11
01489: 
01490:     .line 317
01491:     invoke-virtual {v1, v10, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;
01492: 
01493:     move-result-object v1
01494: 
```

Excerpt 7:

```smali
01602: 
01603:     if-eqz p1, :cond_27a
01604: 
01605:     invoke-virtual {p1}, Ljava/lang/Object;->toString()Ljava/lang/String;
01606: 
01607:     move-result-object v7
01608: 
01609:     :cond_27a
01610:     invoke-interface {v0, v7}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;->setCurrentFragment(Ljava/lang/String;)V
01611: 
01612:     .line 337
01613:     :cond_27d
01614:     const-string p1, "106"
01615: 
01616:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01617: 
01618:     move-result v0
01619: 
01620:     if-eqz v0, :cond_2b1
01621: 
01622:     .line 338
01623:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01624: 
01625:     move-result-object p1
01626: 
01627:     if-eqz p1, :cond_295
01628: 
01629:     .line 339
01630:     check-cast p1, Ljava/lang/Boolean;
01631: 
01632:     invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z
01633: 
01634:     move-result p1
01635: 
01636:     if-eqz p1, :cond_295
01637: 
01638:     move p1, v4
01639: 
01640:     goto :goto_296
01641: 
01642:     :cond_295
01643:     move p1, v8
01644: 
01645:     .line 340
01646:     :goto_296
01647:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01648: 
01649:     invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01650: 
01651:     move-result-object v0
01652: 
01653:     :goto_29c
```

Excerpt 8:

```smali
01667:     invoke-virtual {v1, p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setAlarm(Z)V
01668: 
01669:     goto :goto_29c
01670: 
01671:     .line 343
01672:     :cond_2ac
01673:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;
01674: 
01675:     invoke-interface {v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800View;->deviceAlarm(Z)V
01676: 
01677:     .line 346
01678:     :cond_2b1
01679:     const-string p1, "107"
01680: 
01681:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01682: 
01683:     move-result p1
01684: 
01685:     if-eqz p1, :cond_2de
01686: 
01687:     .line 347
01688:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01689: 
01690:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01691: 
01692:     move-result-object p1
01693: 
01694:     :cond_2bf
01695:     :goto_2bf
01696:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
01697: 
01698:     move-result v0
01699: 
01700:     if-eqz v0, :cond_2db
01701: 
01702:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01703: 
01704:     move-result-object v0
01705: 
01706:     check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01707: 
01708:     .line 348
01709:     invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWorkMode()Ljava/lang/String;
01710: 
01711:     move-result-object v1
```

Excerpt 9:

```smali
01720:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;
01721: 
01722:     invoke-virtual {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->setNextTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
01723: 
01724:     goto :goto_2bf
01725: 
01726:     .line 352
01727:     :cond_2db
01728:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->updateNextTime()V
01729: 
01730:     .line 355
01731:     :cond_2de
01732:     const-string p1, "108"
01733: 
01734:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01735: 
01736:     move-result v0
01737: 
01738:     if-eqz v0, :cond_32e
01739: 
01740:     .line 356
01741:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01742: 
01743:     move-result-object p1
01744: 
01745:     .line 357
01746:     check-cast p1, Ljava/lang/Integer;
01747: 
01748:     invoke-virtual {p1}, Ljava/lang/Integer;->intValue()I
01749: 
01750:     move-result p1
01751: 
01752:     move v0, v8
01753: 
01754:     .line 358
01755:     :goto_2f1
01756:     iget v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneNum:I
01757: 
01758:     if-ge v0, v1, :cond_314
01759: 
01760:     shr-int v1, p1, v0
01761: 
01762:     .line 359
01763:     rem-int/2addr v1, v2
01764: 
01765:     if-nez v1, :cond_306
01766: 
01767:     .line 360
01768:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->zoneBeans:Ljava/util/List;
01769: 
01770:     invoke-interface {v1, v0}, Ljava/util/List;->get(I)Ljava/lang/Object;
01771: 
```

Excerpt 10:

```smali
01817: 
01818:     .line 367
01819:     invoke-static {}, Lcom/thingclips/sdk/eventbus/EventBus;->getDefault()Lcom/thingclips/sdk/eventbus/EventBus;
01820: 
01821:     move-result-object v1
01822: 
01823:     invoke-virtual {v1, v0}, Lcom/thingclips/sdk/eventbus/EventBus;->post(Ljava/lang/Object;)V
01824: 
01825:     goto :goto_31a
01826: 
01827:     .line 371
01828:     :cond_32e
01829:     const-string p1, "110"
01830: 
01831:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->containsKey(Ljava/lang/Object;)Z
01832: 
01833:     move-result v0
01834: 
01835:     if-eqz v0, :cond_35b
01836: 
01837:     .line 372
01838:     invoke-virtual {p2, p1}, Lcom/alibaba/fastjson/JSONObject;->get(Ljava/lang/Object;)Ljava/lang/Object;
01839: 
01840:     move-result-object p1
01841: 
01842:     if-eqz p1, :cond_35b
01843: 
01844:     .line 374
01845:     instance-of p2, p1, Ljava/lang/Boolean;
01846: 
01847:     if-eqz p2, :cond_349
01848: 
01849:     .line 375
01850:     check-cast p1, Ljava/lang/Boolean;
01851: 
01852:     invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z
01853: 
01854:     move-result p1
01855: 
01856:     iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800Presenter;->isOta:Z
01857: 
01858:     return-void
01859: 
01860:     .line 376
01861:     :cond_349
01862:     instance-of p2, p1, Ljava/lang/Integer;
01863: 
01864:     if-eqz p2, :cond_35b
01865: 
01866:     .line 377
01867:     check-cast p1, Ljava/lang/Integer;
01868: 
```


## `Iic800SchedulePresenter`

### 1. `<init>` — lines 29–73

Header: `.method public constructor <init>(Landroidx/fragment/app/Fragment;Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;)V`

Evidence: protocol/transport/array markers.

```smali
00029: .method public constructor <init>(Landroidx/fragment/app/Fragment;Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;)V
00030:     .registers 4
00031: 
00032:     .line 56
00033:     invoke-direct {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;-><init>()V
00034: 
00035:     .line 343
00036:     new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter$1;
00037: 
00038:     invoke-direct {v0, p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter$1;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;)V
00039: 
00040:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00041: 
00042:     .line 57
00043:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
00044: 
00045:     .line 58
00046:     iput-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;
00047: 
00048:     .line 59
00049:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getActivity()Landroidx/fragment/app/FragmentActivity;
00050: 
00051:     move-result-object p1
00052: 
00053:     invoke-virtual {p1}, Landroidx/fragment/app/FragmentActivity;->getIntent()Landroid/content/Intent;
00054: 
00055:     move-result-object p1
00056: 
00057:     const-string p2, "devId"
00058: 
00059:     invoke-virtual {p1, p2}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;
00060: 
00061:     move-result-object p1
00062: 
00063:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;
00064: 
00065:     .line 60
00066:     invoke-static {p1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00067: 
00068:     move-result-object p1
00069: 
00070:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00071: 
00072:     return-void
00073: .end method
```

### 2. `parseIICZoneBean` — lines 93–320

Header: `.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;`

Evidence: protocol/transport/array markers; protocol-facing method name.

Excerpt 1:

```smali
00093: .method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
00094:     .registers 8
00095: 
00096:     .line 127
00097:     new-instance v0, Ljava/lang/StringBuilder;
00098: 
00099:     const/4 v1, 0x2
00100: 
00101:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00102: 
00103:     move-result-object p1
00104: 
00105:     invoke-direct {v0, p1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
00106: 
00107:     .line 128
00108:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I
00109: 
00110:     move-result p1
00111: 
00112:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00113: 
00114:     move-result-object p1
00115: 
00116:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00117: 
00118:     const/4 p1, 0x0
00119: 
00120:     move v2, p1
00121: 
00122:     .line 129
00123:     :goto_17
00124:     const-string v3, "FF"
00125: 
00126:     const/4 v4, 0x6
00127: 
00128:     if-ge v2, v4, :cond_42
00129: 
00130:     .line 130
00131:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00132: 
00133:     move-result-object v4
00134: 
00135:     invoke-interface {v4}, Ljava/util/List;->size()I
00136: 
00137:     move-result v4
00138: 
00139:     if-ge v2, v4, :cond_3c
00140: 
00141:     .line 131
00142:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00143: 
00144:     move-result-object v3
00145: 
00146:     invoke-interface {v3, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;
00147: 
00148:     move-result-object v3
00149: 
00150:     check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
00151: 
00152:     invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I
00153: 
00154:     move-result v3
00155: 
00156:     invoke-static {v3, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00157: 
00158:     move-result-object v3
00159: 
00160:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00161: 
00162:     goto :goto_3f
00163: 
00164:     .line 133
00165:     :cond_3c
00166:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00167: 
00168:     :goto_3f
00169:     add-int/lit8 v2, v2, 0x1
00170: 
00171:     goto :goto_17
00172: 
00173:     :cond_42
00174:     :goto_42
00175:     if-ge p1, v4, :cond_6a
00176: 
00177:     .line 137
00178:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00179: 
00180:     move-result-object v2
00181: 
00182:     invoke-interface {v2}, Ljava/util/List;->size()I
00183: 
00184:     move-result v2
00185: 
00186:     if-ge p1, v2, :cond_64
```

Excerpt 2:

```smali
00189:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00190: 
00191:     move-result-object v2
00192: 
00193:     invoke-interface {v2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;
00194: 
00195:     move-result-object v2
00196: 
00197:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
00198: 
00199:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I
00200: 
00201:     move-result v2
00202: 
00203:     invoke-static {v2, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00204: 
00205:     move-result-object v2
00206: 
00207:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00208: 
00209:     goto :goto_67
00210: 
00211:     .line 140
00212:     :cond_64
00213:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00214: 
00215:     :goto_67
00216:     add-int/lit8 p1, p1, 0x1
00217: 
00218:     goto :goto_42
00219: 
00220:     .line 143
00221:     :cond_6a
00222:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
00223: 
00224:     move-result p1
00225: 
00226:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00227: 
00228:     move-result-object p1
00229: 
00230:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00231: 
00232:     .line 144
00233:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
00234: 
00235:     move-result p1
00236: 
00237:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00238: 
00239:     move-result-object p1
00240: 
00241:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00242: 
00243:     .line 145
00244:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I
00245: 
00246:     move-result p1
00247: 
00248:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00249: 
00250:     move-result-object p1
00251: 
00252:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00253: 
00254:     .line 146
00255:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I
00256: 
00257:     move-result p1
00258: 
00259:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00260: 
00261:     move-result-object p1
00262: 
00263:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00264: 
00265:     .line 147
00266:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I
00267: 
00268:     move-result p1
00269: 
00270:     invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
00271: 
00272:     move-result-object p1
00273: 
00274:     invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00275: 
00276:     .line 148
00277:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z
00278: 
00279:     move-result p1
00280: 
00281:     const-string v1, "1"
00282: 
00283:     const-string v2, "0"
00284: 
00285:     if-eqz p1, :cond_af
00286: 
00287:     .line 149
00288:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00289: 
00290:     goto :goto_b2
00291: 
00292:     .line 151
00293:     :cond_af
00294:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00295: 
00296:     .line 153
00297:     :goto_b2
00298:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z
00299: 
00300:     move-result p1
```

### 3. `onDestroy` — lines 1077–1093

Header: `.method public onDestroy()V`

Evidence: protocol/transport/array markers.

```smali
01077: .method public onDestroy()V
01078:     .registers 2
01079: 
01080:     .line 65
01081:     invoke-super {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;->onDestroy()V
01082: 
01083:     .line 66
01084:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01085: 
01086:     if-eqz v0, :cond_a
01087: 
01088:     .line 67
01089:     invoke-interface {v0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->onDestroy()V
01090: 
01091:     :cond_a
01092:     return-void
01093: .end method
```

### 4. `setPlan` — lines 1254–1295

Header: `.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01254: .method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
01255:     .registers 5
01256: 
01257:     .line 120
01258:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
01259: 
01260:     invoke-virtual {v0}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01261: 
01262:     move-result-object v0
01263: 
01264:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01265: 
01266:     .line 122
01267:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
01268: 
01269:     move-result v0
01270: 
01271:     const/4 v1, 0x1
01272: 
01273:     sub-int/2addr v0, v1
01274: 
01275:     shl-int v0, v1, v0
01276: 
01277:     .line 123
01278:     invoke-direct {p0, v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
01279: 
01280:     move-result-object p1
01281: 
01282:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;
01283: 
01284:     invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
01285: 
01286:     move-result-object v0
01287: 
01288:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01289: 
01290:     const-string v2, "38"
01291: 
01292:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01293: 
01294:     return-void
01295: .end method
```

### 5. `setScheduleTime` — lines 1297–1547

Header: `.method public setScheduleTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;I)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

Excerpt 1:

```smali
01301:     new-instance v0, Ljava/lang/StringBuilder;
01302: 
01303:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
01304: 
01305:     move-result v1
01306: 
01307:     const/4 v2, 0x1
01308: 
01309:     sub-int/2addr v1, v2
01310: 
01311:     shl-int v1, v2, v1
01312: 
01313:     const/4 v2, 0x2
01314: 
01315:     invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01316: 
01317:     move-result-object v1
01318: 
01319:     invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01320: 
01321:     .line 164
01322:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01323: 
01324:     move-result-object p2
01325: 
01326:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01327: 
01328:     const/4 p2, 0x0
01329: 
01330:     move v1, p2
01331: 
01332:     .line 165
01333:     :goto_1b
01334:     const-string v3, "FF"
01335: 
01336:     const/4 v4, 0x6
01337: 
01338:     if-ge v1, v4, :cond_46
01339: 
01340:     .line 166
01341:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01342: 
01343:     move-result-object v4
01344: 
01345:     invoke-interface {v4}, Ljava/util/List;->size()I
01346: 
01347:     move-result v4
01348: 
01349:     if-ge v1, v4, :cond_40
01350: 
01351:     .line 167
01352:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01353: 
01354:     move-result-object v3
01355: 
01356:     invoke-interface {v3, v1}, Ljava/util/List;->get(I)Ljava/lang/Object;
01357: 
01358:     move-result-object v3
01359: 
01360:     check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
01361: 
01362:     invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I
01363: 
01364:     move-result v3
01365: 
01366:     invoke-static {v3, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01367: 
01368:     move-result-object v3
01369: 
01370:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01371: 
01372:     goto :goto_43
01373: 
01374:     .line 169
01375:     :cond_40
01376:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01377: 
01378:     :goto_43
01379:     add-int/lit8 v1, v1, 0x1
01380: 
01381:     goto :goto_1b
01382: 
01383:     :cond_46
01384:     :goto_46
01385:     if-ge p2, v4, :cond_6e
01386: 
01387:     .line 173
01388:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01389: 
01390:     move-result-object v1
01391: 
01392:     invoke-interface {v1}, Ljava/util/List;->size()I
01393: 
01394:     move-result v1
01395: 
01396:     if-ge p2, v1, :cond_68
```

Excerpt 2:

```smali
01399:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01400: 
01401:     move-result-object v1
01402: 
01403:     invoke-interface {v1, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;
01404: 
01405:     move-result-object v1
01406: 
01407:     check-cast v1, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
01408: 
01409:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I
01410: 
01411:     move-result v1
01412: 
01413:     invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01414: 
01415:     move-result-object v1
01416: 
01417:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01418: 
01419:     goto :goto_6b
01420: 
01421:     .line 176
01422:     :cond_68
01423:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01424: 
01425:     :goto_6b
01426:     add-int/lit8 p2, p2, 0x1
01427: 
01428:     goto :goto_46
01429: 
01430:     .line 179
01431:     :cond_6e
01432:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
01433: 
01434:     move-result p2
01435: 
01436:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01437: 
01438:     move-result-object p2
01439: 
01440:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01441: 
01442:     .line 180
01443:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
01444: 
01445:     move-result p2
01446: 
01447:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01448: 
01449:     move-result-object p2
01450: 
01451:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01452: 
01453:     .line 181
01454:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I
01455: 
01456:     move-result p2
01457: 
01458:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01459: 
01460:     move-result-object p2
01461: 
01462:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01463: 
01464:     .line 182
01465:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I
01466: 
01467:     move-result p2
01468: 
01469:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01470: 
01471:     move-result-object p2
01472: 
01473:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01474: 
01475:     .line 183
01476:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I
01477: 
01478:     move-result p2
01479: 
01480:     invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01481: 
01482:     move-result-object p2
01483: 
01484:     invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01485: 
01486:     .line 185
01487:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z
01488: 
01489:     move-result p2
01490: 
01491:     const-string v1, "1"
01492: 
01493:     const-string v2, "0"
01494: 
01495:     if-eqz p2, :cond_b3
01496: 
01497:     .line 186
01498:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01499: 
01500:     goto :goto_b6
01501: 
01502:     .line 188
01503:     :cond_b3
01504:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01505: 
01506:     .line 191
01507:     :goto_b6
01508:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z
01509: 
01510:     move-result p1
```

Excerpt 3:

```smali
01524:     :goto_c3
01525:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
01526: 
01527:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01528: 
01529:     move-result-object p1
01530: 
01531:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01532: 
01533:     .line 198
01534:     invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01535: 
01536:     move-result-object p1
01537: 
01538:     iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01539: 
01540:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01541: 
01542:     const-string v1, "38"
01543: 
01544:     invoke-static {v1, p1, p2, v0}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01545: 
01546:     return-void
01547: .end method
```

### 6. `startManuals` — lines 1549–1656

Header: `.method public startManuals(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01549: .method public startManuals(Ljava/util/List;)V
01550:     .registers 6
01551:     .annotation system Ldalvik/annotation/Signature;
01552:         value = {
01553:             "(",
01554:             "Ljava/util/List<",
01555:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
01556:             ">;)V"
01557:         }
01558:     .end annotation
01559: 
01560:     .line 83
01561:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01562: 
01563:     if-eqz v0, :cond_58
01564: 
01565:     .line 84
01566:     new-instance v0, Ljava/lang/StringBuilder;
01567: 
01568:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01569: 
01570:     .line 85
01571:     new-instance v1, Ljava/lang/StringBuilder;
01572: 
01573:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01574: 
01575:     .line 86
01576:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01577: 
01578:     move-result-object p1
01579: 
01580:     :goto_12
01581:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
01582: 
01583:     move-result v2
01584: 
01585:     if-eqz v2, :cond_33
01586: 
01587:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01588: 
01589:     move-result-object v2
01590: 
01591:     check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01592: 
01593:     .line 87
01594:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I
01595: 
01596:     move-result v2
01597: 
01598:     const/4 v3, 0x4
01599: 
01600:     invoke-static {v2, v3}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01601: 
01602:     move-result-object v2
01603: 
01604:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01605: 
01606:     const/4 v2, 0x0
01607: 
01608:     .line 88
01609:     invoke-static {v2, v3}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01610: 
01611:     move-result-object v2
01612: 
01613:     invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01614: 
01615:     goto :goto_12
01616: 
01617:     .line 91
01618:     :cond_33
01619:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
01620: 
01621:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01622: 
01623:     move-result-object p1
01624: 
01625:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01626: 
01627:     .line 92
01628:     new-instance p1, Ljava/lang/StringBuilder;
01629: 
01630:     const-string v2, "0201"
01631: 
01632:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01633: 
01634:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01635: 
01636:     move-result-object p1
01637: 
01638:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01639: 
01640:     move-result-object p1
01641: 
01642:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01643: 
01644:     move-result-object p1
01645: 
01646:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01647: 
01648:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01649: 
01650:     const-string v2, "45"
01651: 
01652:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01653: 
01654:     :cond_58
01655:     return-void
01656: .end method
```

### 7. `stopManual` — lines 1658–1799

Header: `.method public stopManual(Ljava/util/List;)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
01658: .method public stopManual(Ljava/util/List;)V
01659:     .registers 9
01660:     .annotation system Ldalvik/annotation/Signature;
01661:         value = {
01662:             "(",
01663:             "Ljava/util/List<",
01664:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
01665:             ">;)V"
01666:         }
01667:     .end annotation
01668: 
01669:     .line 97
01670:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01671: 
01672:     if-eqz v0, :cond_75
01673: 
01674:     .line 98
01675:     new-instance v0, Ljava/lang/StringBuilder;
01676: 
01677:     invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
01678: 
01679:     .line 99
01680:     new-instance v1, Ljava/lang/StringBuilder;
01681: 
01682:     invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
01683: 
01684:     .line 101
01685:     invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;
01686: 
01687:     move-result-object p1
01688: 
01689:     const/4 v2, 0x0
01690: 
01691:     move v3, v2
01692: 
01693:     :goto_14
01694:     invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z
01695: 
01696:     move-result v4
01697: 
01698:     if-eqz v4, :cond_4e
01699: 
01700:     invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;
01701: 
01702:     move-result-object v4
01703: 
01704:     check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
01705: 
01706:     .line 102
01707:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWateringSwitch()Z
01708: 
01709:     move-result v5
01710: 
01711:     const/4 v6, 0x4
01712: 
01713:     if-eqz v5, :cond_37
01714: 
01715:     .line 104
01716:     invoke-static {v2, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01717: 
01718:     move-result-object v3
01719: 
01720:     invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01721: 
01722:     .line 105
01723:     invoke-static {v2, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01724: 
01725:     move-result-object v3
01726: 
01727:     invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01728: 
01729:     const/4 v3, 0x1
01730: 
01731:     goto :goto_14
01732: 
01733:     .line 107
01734:     :cond_37
01735:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I
01736: 
01737:     move-result v5
01738: 
01739:     invoke-static {v5, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01740: 
01741:     move-result-object v5
01742: 
01743:     invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01744: 
01745:     .line 108
01746:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I
01747: 
01748:     move-result v4
01749: 
01750:     invoke-static {v4, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;
01751: 
01752:     move-result-object v4
01753: 
01754:     invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01755: 
01756:     goto :goto_14
01757: 
01758:     :cond_4e
01759:     if-eqz v3, :cond_75
01760: 
01761:     .line 113
01762:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
01763: 
01764:     invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;
01765: 
01766:     move-result-object p1
01767: 
01768:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
01769: 
01770:     .line 114
01771:     new-instance p1, Ljava/lang/StringBuilder;
01772: 
01773:     const-string v2, "0201"
01774: 
01775:     invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V
01776: 
01777:     invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01778: 
01779:     move-result-object p1
01780: 
01781:     invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;
01782: 
01783:     move-result-object p1
01784: 
01785:     invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
01786: 
01787:     move-result-object p1
01788: 
01789:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
01790: 
01791:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
01792: 
01793:     const-string v2, "45"
01794: 
01795:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
01796: 
01797:     :cond_75
01798:     return-void
01799: .end method
```


## `Iic800SettingsPresenter`

### 1. `initData` — lines 90–193

Header: `.method private initData()V`

Evidence: protocol/transport/array markers.

```smali
00090: .method private initData()V
00091:     .registers 4
00092: 
00093:     .line 49
00094:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00095: 
00096:     invoke-virtual {v0}, Landroid/app/Activity;->getIntent()Landroid/content/Intent;
00097: 
00098:     move-result-object v0
00099: 
00100:     const-string v1, "devId"
00101: 
00102:     invoke-virtual {v0, v1}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;
00103: 
00104:     move-result-object v0
00105: 
00106:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00107: 
00108:     .line 50
00109:     invoke-static {}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->getDataInstance()Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;
00110: 
00111:     move-result-object v0
00112: 
00113:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00114: 
00115:     invoke-interface {v0, v1}, Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;->getDeviceBean(Ljava/lang/String;)Lcom/thingclips/smart/sdk/bean/DeviceBean;
00116: 
00117:     move-result-object v0
00118: 
00119:     .line 51
00120:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00121: 
00122:     invoke-static {v1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;
00123: 
00124:     move-result-object v1
00125: 
00126:     iput-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00127: 
00128:     if-eqz v1, :cond_25
00129: 
00130:     .line 54
00131:     invoke-interface {v1, p0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->registerDevListener(Lcom/thingclips/smart/sdk/api/IDevListener;)V
00132: 
00133:     :cond_25
00134:     if-eqz v0, :cond_5d
00135: 
00136:     .line 58
00137:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;
00138: 
00139:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00140: 
00141:     invoke-interface {v2, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getRainSenTotal(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00142: 
00143:     move-result v2
00144: 
00145:     invoke-interface {v1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;->setRainSenTotal(Z)V
00146: 
00147:     .line 59
00148:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;
00149: 
00150:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00151: 
00152:     invoke-interface {v2, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getSenAdj(Lcom/thingclips/smart/sdk/bean/DeviceBean;)I
00153: 
00154:     move-result v2
00155: 
00156:     invoke-interface {v1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;->setSenAdjRange(I)V
00157: 
00158:     .line 60
00159:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;
00160: 
00161:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00162: 
00163:     invoke-interface {v2, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getPowerStatus(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00164: 
00165:     move-result v2
00166: 
00167:     invoke-interface {v1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;->setPowerStatus(Z)V
00168: 
00169:     .line 61
00170:     sget-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;
00171: 
00172:     sget-object v2, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_800:Ljava/lang/String;
00173: 
00174:     invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
00175: 
00176:     move-result v1
00177: 
00178:     if-nez v1, :cond_5d
00179: 
00180:     .line 62
00181:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;
00182: 
00183:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00184: 
00185:     invoke-interface {v2, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getMainValue2(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00186: 
00187:     move-result v0
00188: 
00189:     invoke-interface {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/view/IIic800SettingsView;->setMainValue(Z)V
00190: 
00191:     :cond_5d
00192:     return-void
00193: .end method
```

### 2. `lambda$showMainValueDialog$0` — lines 195–222

Header: `.method private synthetic lambda$showMainValueDialog$0(Landroid/app/Dialog;Landroid/view/View;)V`

Evidence: protocol/transport/array markers.

```smali
00195: .method private synthetic lambda$showMainValueDialog$0(Landroid/app/Dialog;Landroid/view/View;)V
00196:     .registers 5
00197: 
00198:     .line 208
00199:     invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V
00200: 
00201:     .line 209
00202:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00203: 
00204:     invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00205: 
00206:     const/4 p1, 0x0
00207: 
00208:     .line 210
00209:     invoke-static {p1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;
00210: 
00211:     move-result-object p1
00212: 
00213:     iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00214: 
00215:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00216: 
00217:     const-string v1, "111"
00218: 
00219:     invoke-static {v1, p1, p2, v0}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00220: 
00221:     return-void
00222: .end method
```

### 3. `changeMainValve` — lines 307–359

Header: `.method public changeMainValve()V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00307: .method public changeMainValve()V
00308:     .registers 5
00309: 
00310:     .line 90
00311:     invoke-static {}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->getDataInstance()Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;
00312: 
00313:     move-result-object v0
00314: 
00315:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00316: 
00317:     invoke-interface {v0, v1}, Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;->getDeviceBean(Ljava/lang/String;)Lcom/thingclips/smart/sdk/bean/DeviceBean;
00318: 
00319:     move-result-object v0
00320: 
00321:     if-eqz v0, :cond_18
00322: 
00323:     .line 91
00324:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00325: 
00326:     invoke-interface {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getMainValue2(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00327: 
00328:     move-result v0
00329: 
00330:     if-eqz v0, :cond_18
00331: 
00332:     .line 92
00333:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->showMainValueDialog()V
00334: 
00335:     return-void
00336: 
00337:     .line 94
00338:     :cond_18
00339:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00340: 
00341:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00342: 
00343:     const/4 v0, 0x1
00344: 
00345:     .line 95
00346:     invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;
00347: 
00348:     move-result-object v0
00349: 
00350:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00351: 
00352:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00353: 
00354:     const-string v3, "111"
00355: 
00356:     invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00357: 
00358:     return-void
00359: .end method
```

### 4. `changeRainSensor` — lines 361–405

Header: `.method public changeRainSensor()V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00361: .method public changeRainSensor()V
00362:     .registers 5
00363: 
00364:     .line 76
00365:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00366: 
00367:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00368: 
00369:     .line 77
00370:     invoke-static {}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->getDataInstance()Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;
00371: 
00372:     move-result-object v0
00373: 
00374:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00375: 
00376:     invoke-interface {v0, v1}, Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;->getDeviceBean(Ljava/lang/String;)Lcom/thingclips/smart/sdk/bean/DeviceBean;
00377: 
00378:     move-result-object v0
00379: 
00380:     if-eqz v0, :cond_26
00381: 
00382:     .line 79
00383:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00384: 
00385:     invoke-interface {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getRainSenTotal(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00386: 
00387:     move-result v0
00388: 
00389:     xor-int/lit8 v0, v0, 0x1
00390: 
00391:     invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;
00392: 
00393:     move-result-object v0
00394: 
00395:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00396: 
00397:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00398: 
00399:     const-string v3, "102"
00400: 
00401:     invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00402: 
00403:     :cond_26
00404:     return-void
00405: .end method
```

### 5. `changeSeaAdjValue` — lines 407–433

Header: `.method public changeSeaAdjValue(I)V`

Evidence: protocol/transport/array markers; protocol-facing method name.

```smali
00407: .method public changeSeaAdjValue(I)V
00408:     .registers 5
00409: 
00410:     .line 100
00411:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00412: 
00413:     if-eqz v0, :cond_7
00414: 
00415:     .line 101
00416:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00417: 
00418:     .line 102
00419:     :cond_7
00420:     invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;
00421: 
00422:     move-result-object p1
00423: 
00424:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00425: 
00426:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00427: 
00428:     const-string v2, "103"
00429: 
00430:     invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00431: 
00432:     return-void
00433: .end method
```

### 6. `onDestroy` — lines 560–576

Header: `.method public onDestroy()V`

Evidence: protocol/transport/array markers.

```smali
00560: .method public onDestroy()V
00561:     .registers 2
00562: 
00563:     .line 69
00564:     invoke-super {p0}, Lcom/thingclips/smart/android/mvp/presenter/BasePresenter;->onDestroy()V
00565: 
00566:     .line 70
00567:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00568: 
00569:     if-eqz v0, :cond_a
00570: 
00571:     .line 71
00572:     invoke-interface {v0}, Lcom/thingclips/smart/sdk/api/IThingDevice;->unRegisterDevListener()V
00573: 
00574:     :cond_a
00575:     return-void
00576: .end method
```

### 7. `resetDevice` — lines 699–787

Header: `.method public resetDevice()V`

Evidence: protocol/transport/array markers.

```smali
00699: .method public resetDevice()V
00700:     .registers 6
00701: 
00702:     .line 113
00703:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00704: 
00705:     invoke-virtual {v0}, Landroid/app/Activity;->getPackageName()Ljava/lang/String;
00706: 
00707:     move-result-object v1
00708: 
00709:     const/4 v2, 0x0
00710: 
00711:     invoke-virtual {v0, v1, v2}, Landroid/app/Activity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;
00712: 
00713:     move-result-object v0
00714: 
00715:     .line 114
00716:     invoke-interface {v0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
00717: 
00718:     move-result-object v0
00719: 
00720:     const/4 v1, 0x1
00721: 
00722:     move v2, v1
00723: 
00724:     :goto_11
00725:     const/16 v3, 0x8
00726: 
00727:     if-gt v2, v3, :cond_34
00728: 
00729:     .line 116
00730:     new-instance v3, Ljava/lang/StringBuilder;
00731: 
00732:     invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V
00733: 
00734:     iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00735: 
00736:     invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00737: 
00738:     move-result-object v3
00739: 
00740:     invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
00741: 
00742:     move-result-object v3
00743: 
00744:     const-string v4, "SeaAdjSwitch"
00745: 
00746:     invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00747: 
00748:     move-result-object v3
00749: 
00750:     invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00751: 
00752:     move-result-object v3
00753: 
00754:     invoke-interface {v0, v3, v1}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;
00755: 
00756:     add-int/lit8 v2, v2, 0x1
00757: 
00758:     goto :goto_11
00759: 
00760:     .line 118
00761:     :cond_34
00762:     invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->apply()V
00763: 
00764:     .line 119
00765:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mContext:Landroid/app/Activity;
00766: 
00767:     if-eqz v0, :cond_3e
00768: 
00769:     .line 120
00770:     invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
00771: 
00772:     .line 121
00773:     :cond_3e
00774:     invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;
00775: 
00776:     move-result-object v0
00777: 
00778:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00779: 
00780:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00781: 
00782:     const-string v3, "105"
00783: 
00784:     invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00785: 
00786:     return-void
00787: .end method
```

### 8. `setPowerStatus` — lines 789–839

Header: `.method public setPowerStatus()V`

Evidence: protocol/transport/array markers.

```smali
00789: .method public setPowerStatus()V
00790:     .registers 5
00791: 
00792:     .line 125
00793:     invoke-static {}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->getDataInstance()Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;
00794: 
00795:     move-result-object v0
00796: 
00797:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->devId:Ljava/lang/String;
00798: 
00799:     invoke-interface {v0, v1}, Lcom/thingclips/smart/home/sdk/api/IThingHomeDataManager;->getDeviceBean(Ljava/lang/String;)Lcom/thingclips/smart/sdk/bean/DeviceBean;
00800: 
00801:     move-result-object v0
00802: 
00803:     if-eqz v0, :cond_29
00804: 
00805:     .line 127
00806:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mModel:Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;
00807: 
00808:     invoke-interface {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800SettingsModel;->getPowerStatus(Lcom/thingclips/smart/sdk/bean/DeviceBean;)Z
00809: 
00810:     move-result v0
00811: 
00812:     const-string v1, "101"
00813: 
00814:     if-eqz v0, :cond_20
00815: 
00816:     .line 128
00817:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00818: 
00819:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00820: 
00821:     const-string v3, "OFF"
00822: 
00823:     invoke-static {v1, v3, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00824: 
00825:     return-void
00826: 
00827:     .line 130
00828:     :cond_20
00829:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;
00830: 
00831:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SettingsPresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;
00832: 
00833:     const-string v3, "Auto"
00834: 
00835:     invoke-static {v1, v3, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V
00836: 
00837:     :cond_29
00838:     return-void
00839: .end method
```
