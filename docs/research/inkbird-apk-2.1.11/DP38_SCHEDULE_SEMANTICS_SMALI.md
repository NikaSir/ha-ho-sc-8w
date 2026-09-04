# IIC-800 DP38 schedule semantics — exact smali excerpts

> Focused evidence only; complete smali remains in the ephemeral workflow artifact.

## `Iic800AddPlanActivity.smali`

### Excerpt 1 — lines 26–84

```smali
00026: .field private dateText:Landroid/widget/TextView;
00027: 
00028: .field private devId:Ljava/lang/String;
00029: 
00030: .field private disposable:Lio/reactivex/rxjava3/disposables/Disposable;
00031: 
00032: .field private finalTotalSea:Z
00033: 
00034: .field private haveCheckZones:Ljava/util/List;
00035:     .annotation system Ldalvik/annotation/Signature;
00036:         value = {
00037:             "Ljava/util/List<",
00038:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
00039:             ">;"
00040:         }
00041:     .end annotation
00042: .end field
00043: 
00044: .field private intervalsLayout:Landroid/widget/LinearLayout;
00045: 
00046: .field private intervalsText:Landroid/widget/TextView;
00047: 
00048: .field private isChecked:Z
00049: 
00050: .field private nameEdit:Landroid/widget/EditText;
00051: 
00052: .field private numberText:Landroid/widget/TextView;
00053: 
00054: .field private numbersRV:Landroidx/recyclerview/widget/RecyclerView;
00055: 
00056: .field private periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
00057: 
00058: .field private presenter:Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;
00059: 
00060: .field private rainText:Landroid/widget/TextView;
00061: 
00062: .field private rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;
00063: 
00064: .field private rb_sea_yes:Landroid/widget/RadioButton;
00065: 
00066: .field private resetText:Landroid/widget/TextView;
00067: 
00068: .field private rsbTipText:Landroid/widget/TextView;
00069: 
00070: .field private sensorGroup:Landroid/widget/RadioGroup;
00071: 
00072: .field private sharedPreferences:Landroid/content/SharedPreferences;
00073: 
00074: .field private startRv:Landroidx/recyclerview/widget/RecyclerView;
00075: 
00076: .field private startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;
00077: 
00078: .field private timeText:Landroid/widget/TextView;
00079: 
00080: .field private weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;
00081: 
00082: .field private weekRv:Landroidx/recyclerview/widget/RecyclerView;
00083: 
00084: .field private zoneNumbers:Ljava/util/List;
```

### Excerpt 2 — lines 153–257

```smali
00153:     .registers 4
00154: 
00155:     invoke-direct {p0, p1, p2, p3}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->lambda$showSetTimeDialog$9(Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V
00156: 
00157:     return-void
00158: .end method
00159: 
00160: .method public static synthetic $r8$lambda$_0CsTR9FmMn7LL3-UQu6F8BK1lw(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/view/View;)V
00161:     .registers 2
00162: 
00163:     invoke-direct {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->lambda$setZonesNumberText$2(Landroid/view/View;)V
00164: 
00165:     return-void
00166: .end method
00167: 
00168: .method public static synthetic $r8$lambda$qVR8nz4bKHybc4oqFXAJV0pQIlU(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V
00169:     .registers 5
00170: 
00171:     invoke-direct {p0, p1, p2, p3, p4}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->lambda$showIntervalDialog$6(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V
00172: 
00173:     return-void
00174: .end method
00175: 
00176: .method static bridge synthetic -$$Nest$fgetrsbTipText(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)Landroid/widget/TextView;
00177:     .registers 1
00178: 
00179:     iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rsbTipText:Landroid/widget/TextView;
00180: 
00181:     return-object p0
00182: .end method
00183: 
00184: .method static bridge synthetic -$$Nest$fgettimeText(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)Landroid/widget/TextView;
00185:     .registers 1
00186: 
00187:     iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;
00188: 
00189:     return-object p0
00190: .end method
00191: 
00192: .method public constructor <init>()V
00193:     .registers 2
00194: 
00195:     .line 60
00196:     invoke-direct {p0}, Lcom/inkbird/base/activity/BaseActivity;-><init>()V
00197: 
00198:     .line 86
00199:     new-instance v0, Ljava/util/ArrayList;
00200: 
00201:     invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V
00202: 
00203:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->zoneNumbers:Ljava/util/List;
00204: 
00205:     .line 88
00206:     new-instance v0, Ljava/util/ArrayList;
00207: 
00208:     invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V
00209: 
00210:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->haveCheckZones:Ljava/util/List;
00211: 
00212:     return-void
00213: .end method
00214: 
00215: .method private initListener()V
00216:     .registers 6
00217: 
00218:     .line 166
00219:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
00220: 
00221:     invoke-virtual {v0, p0}, Landroid/widget/TextView;->setOnClickListener(Landroid/view/View$OnClickListener;)V
00222: 
00223:     .line 167
00224:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;
00225: 
00226:     invoke-virtual {v0, p0}, Landroid/widget/TextView;->setOnClickListener(Landroid/view/View$OnClickListener;)V
00227: 
00228:     .line 168
00229:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;
00230: 
00231:     invoke-virtual {v0, p0}, Landroid/widget/TextView;->setOnClickListener(Landroid/view/View$OnClickListener;)V
00232: 
00233:     .line 169
00234:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->copyIV:Landroid/widget/ImageView;
00235: 
00236:     invoke-virtual {v0, p0}, Landroid/widget/ImageView;->setOnClickListener(Landroid/view/View$OnClickListener;)V
00237: 
00238:     .line 171
00239:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;
00240: 
00241:     new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$3;
00242: 
00243:     invoke-direct {v1, p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$3;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)V
00244: 
00245:     invoke-virtual {v0, v1}, Lcom/jaygoo/widget/RangeSeekBar;->setOnRangeChangedListener(Lcom/jaygoo/widget/OnRangeChangedListener;)V
00246: 
00247:     .line 193
00248:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
00249: 
00250:     new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda1;
00251: 
00252:     invoke-direct {v1, p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda1;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)V
00253: 
00254:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->setOnCheckedChangeListener(Landroid/widget/RadioGroup$OnCheckedChangeListener;)V
00255: 
00256:     .line 224
00257:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->zoneNumbers:Ljava/util/List;
```

### Excerpt 3 — lines 457–524

```smali
00457:     .line 119
00458:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00459: 
00460:     move-result-object v0
00461: 
00462:     check-cast v0, Landroidx/recyclerview/widget/RecyclerView;
00463: 
00464:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00465: 
00466:     const v0, 0x7f0a1367
00467: 
00468:     .line 120
00469:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00470: 
00471:     move-result-object v0
00472: 
00473:     check-cast v0, Landroid/widget/LinearLayout;
00474: 
00475:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00476: 
00477:     const v0, 0x7f0a247d
00478: 
00479:     .line 121
00480:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00481: 
00482:     move-result-object v0
00483: 
00484:     check-cast v0, Landroid/widget/TextView;
00485: 
00486:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
00487: 
00488:     const v0, 0x7f0a247e
00489: 
00490:     .line 122
00491:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00492: 
00493:     move-result-object v0
00494: 
00495:     check-cast v0, Landroid/widget/TextView;
00496: 
00497:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;
00498: 
00499:     const v0, 0x7f0a1b0a
00500: 
00501:     .line 123
00502:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00503: 
00504:     move-result-object v0
00505: 
00506:     check-cast v0, Lcom/jaygoo/widget/RangeSeekBar;
00507: 
00508:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;
00509: 
00510:     const v0, 0x7f0a274f
00511: 
00512:     .line 124
00513:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
00514: 
00515:     move-result-object v0
00516: 
00517:     check-cast v0, Landroid/widget/TextView;
00518: 
00519:     iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;
00520: 
00521:     const v0, 0x7f0a13b5
00522: 
00523:     .line 125
00524:     invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;
```

### Excerpt 4 — lines 769–944

```smali
00769:     if-ne p2, p1, :cond_22
00770: 
00771:     .line 195
00772:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00773: 
00774:     invoke-virtual {p1}, Landroidx/recyclerview/widget/RecyclerView;->getVisibility()I
00775: 
00776:     move-result p1
00777: 
00778:     if-nez p1, :cond_14
00779: 
00780:     .line 196
00781:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00782: 
00783:     invoke-virtual {p1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V
00784: 
00785:     .line 198
00786:     :cond_14
00787:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00788: 
00789:     invoke-virtual {p1}, Landroid/widget/LinearLayout;->getVisibility()I
00790: 
00791:     move-result p1
00792: 
00793:     if-nez p1, :cond_82
00794: 
00795:     .line 199
00796:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00797: 
00798:     invoke-virtual {p1, v0}, Landroid/widget/LinearLayout;->setVisibility(I)V
00799: 
00800:     return-void
00801: 
00802:     :cond_22
00803:     const p1, 0x7f0a18a2
00804: 
00805:     if-ne p2, p1, :cond_42
00806: 
00807:     .line 202
00808:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00809: 
00810:     invoke-virtual {p1}, Landroidx/recyclerview/widget/RecyclerView;->getVisibility()I
00811: 
00812:     move-result p1
00813: 
00814:     if-nez p1, :cond_34
00815: 
00816:     .line 203
00817:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00818: 
00819:     invoke-virtual {p1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V
00820: 
00821:     .line 205
00822:     :cond_34
00823:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00824: 
00825:     invoke-virtual {p1}, Landroid/widget/LinearLayout;->getVisibility()I
00826: 
00827:     move-result p1
00828: 
00829:     if-nez p1, :cond_82
00830: 
00831:     .line 206
00832:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00833: 
00834:     invoke-virtual {p1, v0}, Landroid/widget/LinearLayout;->setVisibility(I)V
00835: 
00836:     return-void
00837: 
00838:     :cond_42
00839:     const p1, 0x7f0a189c
00840: 
00841:     const/4 v1, 0x0
00842: 
00843:     if-ne p2, p1, :cond_63
00844: 
00845:     .line 209
00846:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00847: 
00848:     invoke-virtual {p1}, Landroidx/recyclerview/widget/RecyclerView;->getVisibility()I
00849: 
00850:     move-result p1
00851: 
00852:     if-ne p1, v0, :cond_55
00853: 
00854:     .line 210
00855:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00856: 
00857:     invoke-virtual {p1, v1}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V
00858: 
00859:     .line 212
00860:     :cond_55
00861:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00862: 
00863:     invoke-virtual {p1}, Landroid/widget/LinearLayout;->getVisibility()I
00864: 
00865:     move-result p1
00866: 
00867:     if-nez p1, :cond_82
00868: 
00869:     .line 213
00870:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00871: 
00872:     invoke-virtual {p1, v0}, Landroid/widget/LinearLayout;->setVisibility(I)V
00873: 
00874:     return-void
00875: 
00876:     :cond_63
00877:     const p1, 0x7f0a18a8
00878: 
00879:     if-ne p2, p1, :cond_82
00880: 
00881:     .line 216
00882:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00883: 
00884:     invoke-virtual {p1}, Landroidx/recyclerview/widget/RecyclerView;->getVisibility()I
00885: 
00886:     move-result p1
00887: 
00888:     if-nez p1, :cond_75
00889: 
00890:     .line 217
00891:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;
00892: 
00893:     invoke-virtual {p1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V
00894: 
00895:     .line 219
00896:     :cond_75
00897:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00898: 
00899:     invoke-virtual {p1}, Landroid/widget/LinearLayout;->getVisibility()I
00900: 
00901:     move-result p1
00902: 
00903:     if-ne p1, v0, :cond_82
00904: 
00905:     .line 220
00906:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;
00907: 
00908:     invoke-virtual {p1, v1}, Landroid/widget/LinearLayout;->setVisibility(I)V
00909: 
00910:     :cond_82
00911:     return-void
00912: .end method
00913: 
00914: .method private synthetic lambda$setZoneNumberText$1(Landroid/view/View;)V
00915:     .registers 3
00916: 
00917:     .line 358
00918:     iget-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z
00919: 
00920:     if-nez p1, :cond_f
00921: 
00922:     .line 359
00923:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;
00924: 
00925:     const v0, 0x7f0a18c3
00926: 
00927:     invoke-virtual {p1, v0}, Landroid/widget/RadioGroup;->check(I)V
00928: 
00929:     .line 360
00930:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->showRainSensorDialog()V
00931: 
00932:     :cond_f
00933:     return-void
00934: .end method
00935: 
00936: .method private synthetic lambda$setZonesNumberText$2(Landroid/view/View;)V
00937:     .registers 3
00938: 
00939:     .line 386
00940:     iget-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z
00941: 
00942:     if-nez p1, :cond_f
00943: 
00944:     .line 387
```

### Excerpt 5 — lines 973–1036

```smali
00973:     .line 711
00974:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->haveCheckZones:Ljava/util/List;
00975: 
00976:     invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/CopyLicZoneBeanAdapter;->getSelectIndex()I
00977: 
00978:     move-result p2
00979: 
00980:     invoke-interface {p1, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;
00981: 
00982:     move-result-object p1
00983: 
00984:     check-cast p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00985: 
00986:     invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->initDataViews(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
00987: 
00988:     return-void
00989: .end method
00990: 
00991: .method private synthetic lambda$showIntervalDialog$6(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V
00992:     .registers 5
00993: 
00994:     .line 558
00995:     invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V
00996: 
00997:     .line 559
00998:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
00999: 
01000:     invoke-virtual {p3}, Lcom/weigan/loopview/LoopView;->getSelectedItem()I
01001: 
01002:     move-result p3
01003: 
01004:     invoke-interface {p2, p3}, Ljava/util/List;->get(I)Ljava/lang/Object;
01005: 
01006:     move-result-object p2
01007: 
01008:     check-cast p2, Ljava/lang/CharSequence;
01009: 
01010:     invoke-virtual {p1, p2}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V
01011: 
01012:     return-void
01013: .end method
01014: 
01015: .method static synthetic lambda$showRainSensorDialog$4(Landroid/app/Dialog;Landroid/view/View;)V
01016:     .registers 2
01017: 
01018:     .line 462
01019:     invoke-virtual {p0}, Landroid/app/Dialog;->dismiss()V
01020: 
01021:     return-void
01022: .end method
01023: 
01024: .method private synthetic lambda$showResetDialog$10(Landroid/app/Dialog;Landroid/view/View;)V
01025:     .registers 3
01026: 
01027:     .line 683
01028:     invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V
01029: 
01030:     .line 684
01031:     iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->presenter:Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;
01032: 
01033:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->reset()V
01034: 
01035:     return-void
01036: .end method
```

### Excerpt 6 — lines 1387–1443

```smali
01387:     invoke-virtual {v1, v3}, Landroid/view/View;->setOnClickListener(Landroid/view/View$OnClickListener;)V
01388: 
01389:     const v1, 0x7f0a297b
01390: 
01391:     .line 709
01392:     invoke-virtual {v0, v1}, Landroid/app/Dialog;->findViewById(I)Landroid/view/View;
01393: 
01394:     move-result-object v1
01395: 
01396:     new-instance v3, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda3;
01397: 
01398:     invoke-direct {v3, p0, v0, v2}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda3;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/app/Dialog;Lcom/inkbird/inkbirdapp/device/iic800/adapter/CopyLicZoneBeanAdapter;)V
01399: 
01400:     invoke-virtual {v1, v3}, Landroid/view/View;->setOnClickListener(Landroid/view/View$OnClickListener;)V
01401: 
01402:     return-void
01403: .end method
01404: 
01405: .method private showIntervalDialog()V
01406:     .registers 7
01407: 
01408:     .line 530
01409:     new-instance v0, Landroid/app/Dialog;
01410: 
01411:     const v1, 0x7f1501e2
01412: 
01413:     invoke-direct {v0, p0, v1}, Landroid/app/Dialog;-><init>(Landroid/content/Context;I)V
01414: 
01415:     const v1, 0x7f0d05a6
01416: 
01417:     const/4 v2, 0x0
01418: 
01419:     .line 531
01420:     invoke-static {p0, v1, v2}, Landroid/view/View;->inflate(Landroid/content/Context;ILandroid/view/ViewGroup;)Landroid/view/View;
01421: 
01422:     move-result-object v1
01423: 
01424:     .line 532
01425:     invoke-virtual {v0, v1}, Landroid/app/Dialog;->setContentView(Landroid/view/View;)V
01426: 
01427:     .line 534
01428:     invoke-virtual {v0}, Landroid/app/Dialog;->getWindow()Landroid/view/Window;
01429: 
01430:     move-result-object v1
01431: 
01432:     const/16 v2, 0x50
01433: 
01434:     .line 535
01435:     invoke-virtual {v1, v2}, Landroid/view/Window;->setGravity(I)V
01436: 
01437:     const v2, 0x7f150140
01438: 
01439:     .line 536
01440:     invoke-virtual {v1, v2}, Landroid/view/Window;->setWindowAnimations(I)V
01441: 
01442:     const/4 v2, -0x1
01443: 
```

### Excerpt 7 — lines 1489–1545

```smali
01489:     if-ge v3, v4, :cond_5a
01490: 
01491:     .line 546
01492:     invoke-static {v3}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;
01493: 
01494:     move-result-object v4
01495: 
01496:     invoke-interface {v2, v4}, Ljava/util/List;->add(Ljava/lang/Object;)Z
01497: 
01498:     add-int/lit8 v3, v3, 0x1
01499: 
01500:     goto :goto_4c
01501: 
01502:     .line 548
01503:     :cond_5a
01504:     invoke-virtual {v1, v2}, Lcom/weigan/loopview/LoopView;->setItems(Ljava/util/List;)V
01505: 
01506:     .line 549
01507:     iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
01508: 
01509:     invoke-virtual {v3}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;
01510: 
01511:     move-result-object v3
01512: 
01513:     invoke-virtual {v3}, Ljava/lang/Object;->toString()Ljava/lang/String;
01514: 
01515:     move-result-object v3
01516: 
01517:     const/4 v4, 0x0
01518: 
01519:     .line 551
01520:     :goto_68
01521:     invoke-interface {v2}, Ljava/util/List;->size()I
01522: 
01523:     move-result v5
01524: 
01525:     if-ge v4, v5, :cond_80
01526: 
01527:     .line 552
01528:     invoke-interface {v2, v4}, Ljava/util/List;->get(I)Ljava/lang/Object;
01529: 
01530:     move-result-object v5
01531: 
01532:     check-cast v5, Ljava/lang/String;
01533: 
01534:     invoke-virtual {v5, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
01535: 
01536:     move-result v5
01537: 
01538:     if-eqz v5, :cond_7d
01539: 
01540:     .line 553
01541:     invoke-virtual {v1, v4}, Lcom/weigan/loopview/LoopView;->setCurrentPosition(I)V
01542: 
01543:     :cond_7d
01544:     add-int/lit8 v4, v4, 0x1
01545: 
```

### Excerpt 8 — lines 2352–2719

```smali
02352:     invoke-direct {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;-><init>(I)V
02353: 
02354:     .line 272
02355:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;
02356: 
02357:     invoke-virtual {v1}, Landroid/widget/EditText;->getText()Landroid/text/Editable;
02358: 
02359:     move-result-object v1
02360: 
02361:     invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;
02362: 
02363:     move-result-object v1
02364: 
02365:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setName(Ljava/lang/String;)V
02366: 
02367:     .line 273
02368:     iget-boolean v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z
02369: 
02370:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setEnable(Z)V
02371: 
02372:     .line 274
02373:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;
02374: 
02375:     invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;
02376: 
02377:     move-result-object v1
02378: 
02379:     invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;
02380: 
02381:     move-result-object v1
02382: 
02383:     invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I
02384: 
02385:     move-result v1
02386: 
02387:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setRunTime(I)V
02388: 
02389:     .line 275
02390:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02391: 
02392:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I
02393: 
02394:     move-result v1
02395: 
02396:     const v2, 0x7f0a189c
02397: 
02398:     const/4 v3, 0x3
02399: 
02400:     const/4 v4, 0x0
02401: 
02402:     if-ne v1, v2, :cond_b9
02403: 
02404:     .line 276
02405:     invoke-virtual {p1, v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V
02406: 
02407:     .line 277
02408:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;
02409: 
02410:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->getChecks()I
02411: 
02412:     move-result v1
02413: 
02414:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleDay(I)V
02415: 
02416:     goto/16 :goto_12c
02417: 
02418:     .line 278
02419:     :cond_b9
02420:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02421: 
02422:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I
02423: 
02424:     move-result v1
02425: 
02426:     const v2, 0x7f0a18ba
02427: 
02428:     if-ne v1, v2, :cond_c8
02429: 
02430:     .line 279
02431:     invoke-virtual {p1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V
02432: 
02433:     goto :goto_12c
02434: 
02435:     .line 280
02436:     :cond_c8
02437:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02438: 
02439:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I
02440: 
02441:     move-result v1
02442: 
02443:     const v2, 0x7f0a18a2
02444: 
02445:     const/4 v5, 0x2
02446: 
02447:     if-ne v1, v2, :cond_d8
02448: 
02449:     .line 281
02450:     invoke-virtual {p1, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V
02451: 
02452:     goto :goto_12c
02453: 
02454:     .line 282
02455:     :cond_d8
02456:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02457: 
02458:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I
02459: 
02460:     move-result v1
02461: 
02462:     const v2, 0x7f0a18a8
02463: 
02464:     if-ne v1, v2, :cond_12c
02465: 
02466:     .line 283
02467:     invoke-virtual {p1, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V
02468: 
02469:     .line 284
02470:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
02471: 
02472:     invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;
02473: 
02474:     move-result-object v1
02475: 
02476:     invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;
02477: 
02478:     move-result-object v1
02479: 
02480:     invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I
02481: 
02482:     move-result v1
02483: 
02484:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleDay(I)V
02485: 
02486:     .line 286
02487:     :try_start_f7
02488:     invoke-static {}, Ljava/util/Locale;->getDefault()Ljava/util/Locale;
02489: 
02490:     move-result-object v1
02491: 
02492:     invoke-static {v5, v1}, Ljava/text/DateFormat;->getDateInstance(ILjava/util/Locale;)Ljava/text/DateFormat;
02493: 
02494:     move-result-object v1
02495: 
02496:     .line 287
02497:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;
02498: 
02499:     invoke-virtual {v2}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;
02500: 
02501:     move-result-object v2
02502: 
02503:     invoke-virtual {v2}, Ljava/lang/Object;->toString()Ljava/lang/String;
02504: 
02505:     move-result-object v2
02506: 
02507:     invoke-virtual {v1, v2}, Ljava/text/DateFormat;->parse(Ljava/lang/String;)Ljava/util/Date;
02508: 
02509:     move-result-object v1
02510: 
02511:     if-eqz v1, :cond_12c
02512: 
02513:     .line 289
02514:     invoke-virtual {v1}, Ljava/util/Date;->getYear()I
02515: 
02516:     move-result v2
02517: 
02518:     add-int/lit8 v2, v2, -0x64
02519: 
02520:     invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalYear(I)V
02521: 
02522:     .line 290
02523:     invoke-virtual {v1}, Ljava/util/Date;->getMonth()I
02524: 
02525:     move-result v2
02526: 
02527:     add-int/2addr v2, v0
02528: 
02529:     invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalMonth(I)V
02530: 
02531:     .line 291
02532:     invoke-virtual {v1}, Ljava/util/Date;->getDate()I
02533: 
02534:     move-result v1
02535: 
02536:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalDay(I)V
02537:     :try_end_127
02538:     .catch Ljava/text/ParseException; {:try_start_f7 .. :try_end_127} :catch_128
02539: 
02540:     goto :goto_12c
02541: 
02542:     :catch_128
02543:     move-exception v1
02544: 
02545:     .line 294
02546:     invoke-virtual {v1}, Ljava/text/ParseException;->printStackTrace()V
02547: 
02548:     .line 297
02549:     :cond_12c
02550:     :goto_12c
02551:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sharedPreferences:Landroid/content/SharedPreferences;
02552: 
02553:     invoke-interface {v1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
02554: 
02555:     move-result-object v1
02556: 
02557:     .line 298
02558:     iget-boolean v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z
02559: 
02560:     invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setTotalSeaSwitch(Z)V
02561: 
02562:     .line 299
02563:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z
02564: 
02565:     move-result v2
02566: 
02567:     const-string v5, "SeaAdjSwitch"
02568: 
02569:     if-eqz v2, :cond_174
02570: 
02571:     .line 300
02572:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;
02573: 
02574:     invoke-virtual {v2}, Landroid/widget/RadioGroup;->getCheckedRadioButtonId()I
02575: 
02576:     move-result v2
02577: 
02578:     const v6, 0x7f0a18c4
02579: 
02580:     if-ne v2, v6, :cond_14b
02581: 
02582:     move v4, v0
02583: 
02584:     :cond_14b
02585:     invoke-virtual {p1, v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setSeaAdjSwitch(Z)V
02586: 
02587:     .line 301
02588:     new-instance v2, Ljava/lang/StringBuilder;
02589: 
02590:     invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V
02591: 
02592:     iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->devId:Ljava/lang/String;
02593: 
02594:     invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
02595: 
02596:     move-result-object v2
02597: 
02598:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
02599: 
02600:     move-result v4
02601: 
02602:     invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
02603: 
02604:     move-result-object v2
02605: 
02606:     invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
02607: 
02608:     move-result-object v2
02609: 
02610:     invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
02611: 
02612:     move-result-object v2
02613: 
02614:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z
02615: 
02616:     move-result v4
02617: 
02618:     invoke-interface {v1, v2, v4}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;
02619: 
02620:     .line 302
02621:     invoke-interface {v1}, Landroid/content/SharedPreferences$Editor;->apply()V
02622: 
02623:     goto :goto_198
02624: 
02625:     .line 304
02626:     :cond_174
02627:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sharedPreferences:Landroid/content/SharedPreferences;
02628: 
02629:     new-instance v2, Ljava/lang/StringBuilder;
02630: 
02631:     invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V
02632: 
02633:     iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->devId:Ljava/lang/String;
02634: 
02635:     invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
02636: 
02637:     move-result-object v2
02638: 
02639:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
02640: 
02641:     move-result v4
02642: 
02643:     invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
02644: 
02645:     move-result-object v2
02646: 
02647:     invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
02648: 
02649:     move-result-object v2
02650: 
02651:     invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
02652: 
02653:     move-result-object v2
02654: 
02655:     invoke-interface {v1, v2, v0}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z
02656: 
02657:     move-result v1
02658: 
02659:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setSeaAdjSwitch(Z)V
02660: 
02661:     .line 307
02662:     :goto_198
02663:     iget-boolean v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z
02664: 
02665:     if-eqz v1, :cond_1e5
02666: 
02667:     .line 308
02668:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02669: 
02670:     move-result v1
02671: 
02672:     if-eqz v1, :cond_1a8
02673: 
02674:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02675: 
02676:     move-result v1
02677: 
02678:     if-ne v1, v3, :cond_1bd
02679: 
02680:     :cond_1a8
02681:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
02682: 
02683:     move-result v1
02684: 
02685:     if-nez v1, :cond_1bd
02686: 
02687:     const p1, 0x7f141295
02688: 
02689:     .line 309
02690:     invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;
02691: 
02692:     move-result-object p1
02693: 
02694:     invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;
02695: 
02696:     move-result-object p1
02697: 
02698:     invoke-virtual {p1}, Landroid/widget/Toast;->show()V
02699: 
02700:     goto :goto_1f3
02701: 
02702:     .line 311
02703:     :cond_1bd
02704:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;
02705: 
02706:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;->getStartTimeBeans()Ljava/util/List;
02707: 
02708:     move-result-object v1
02709: 
02710:     invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setStartTimeList(Ljava/util/List;)V
02711: 
02712:     .line 312
02713:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
02714: 
02715:     move-result-object v1
02716: 
02717:     invoke-interface {v1}, Ljava/util/List;->size()I
02718: 
02719:     move-result v1
```

### Excerpt 9 — lines 2827–3039

```smali
02827: 
02828:     goto :goto_3d
02829: 
02830:     .line 402
02831:     :cond_31
02832:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;
02833: 
02834:     const v1, 0x7f1412c4
02835: 
02836:     invoke-virtual {p0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;
02837: 
02838:     move-result-object v1
02839: 
02840:     invoke-virtual {v0, v1}, Landroid/widget/EditText;->setHint(Ljava/lang/CharSequence;)V
02841: 
02842:     .line 406
02843:     :cond_3d
02844:     :goto_3d
02845:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z
02846: 
02847:     move-result v0
02848: 
02849:     iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z
02850: 
02851:     .line 408
02852:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02853: 
02854:     move-result v0
02855: 
02856:     if-nez v0, :cond_5b
02857: 
02858:     .line 409
02859:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02860: 
02861:     const v1, 0x7f0a189c
02862: 
02863:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V
02864: 
02865:     .line 410
02866:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;
02867: 
02868:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
02869: 
02870:     move-result v1
02871: 
02872:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->setChecks(I)V
02873: 
02874:     goto :goto_c5
02875: 
02876:     .line 411
02877:     :cond_5b
02878:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02879: 
02880:     move-result v0
02881: 
02882:     const/4 v1, 0x1
02883: 
02884:     if-ne v0, v1, :cond_6b
02885: 
02886:     .line 412
02887:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02888: 
02889:     const v1, 0x7f0a18ba
02890: 
02891:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V
02892: 
02893:     goto :goto_c5
02894: 
02895:     .line 413
02896:     :cond_6b
02897:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02898: 
02899:     move-result v0
02900: 
02901:     const/4 v2, 0x2
02902: 
02903:     if-ne v0, v2, :cond_7b
02904: 
02905:     .line 414
02906:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02907: 
02908:     const v1, 0x7f0a18a2
02909: 
02910:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V
02911: 
02912:     goto :goto_c5
02913: 
02914:     .line 415
02915:     :cond_7b
02916:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
02917: 
02918:     move-result v0
02919: 
02920:     const/4 v3, 0x3
02921: 
02922:     if-ne v0, v3, :cond_c5
02923: 
02924:     .line 416
02925:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;
02926: 
02927:     const v3, 0x7f0a18a8
02928: 
02929:     invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V
02930: 
02931:     .line 417
02932:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;
02933: 
02934:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
02935: 
02936:     move-result v3
02937: 
02938:     invoke-static {v3}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;
02939: 
02940:     move-result-object v3
02941: 
02942:     invoke-virtual {v0, v3}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V
02943: 
02944:     .line 418
02945:     new-instance v0, Ljava/util/Date;
02946: 
02947:     invoke-direct {v0}, Ljava/util/Date;-><init>()V
02948: 
02949:     .line 419
02950:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I
02951: 
02952:     move-result v3
02953: 
02954:     add-int/lit8 v3, v3, 0x64
02955: 
02956:     invoke-virtual {v0, v3}, Ljava/util/Date;->setYear(I)V
02957: 
02958:     .line 420
02959:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I
02960: 
02961:     move-result v3
02962: 
02963:     sub-int/2addr v3, v1
02964: 
02965:     invoke-virtual {v0, v3}, Ljava/util/Date;->setMonth(I)V
02966: 
02967:     .line 421
02968:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I
02969: 
02970:     move-result v1
02971: 
02972:     invoke-virtual {v0, v1}, Ljava/util/Date;->setDate(I)V
02973: 
02974:     .line 422
02975:     invoke-static {}, Ljava/util/Locale;->getDefault()Ljava/util/Locale;
02976: 
02977:     move-result-object v1
02978: 
02979:     invoke-static {v2, v1}, Ljava/text/DateFormat;->getDateInstance(ILjava/util/Locale;)Ljava/text/DateFormat;
02980: 
02981:     move-result-object v1
02982: 
02983:     .line 423
02984:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;
02985: 
02986:     invoke-virtual {v1, v0}, Ljava/text/DateFormat;->format(Ljava/util/Date;)Ljava/lang/String;
02987: 
02988:     move-result-object v0
02989: 
02990:     invoke-virtual {v2, v0}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V
02991: 
02992:     .line 426
02993:     :cond_c5
02994:     :goto_c5
02995:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z
02996: 
02997:     move-result v0
02998: 
02999:     if-eqz v0, :cond_da
03000: 
03001:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z
03002: 
03003:     move-result v0
03004: 
03005:     if-eqz v0, :cond_da
03006: 
03007:     .line 427
03008:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;
03009: 
03010:     const v1, 0x7f0a18c4
03011: 
03012:     invoke-virtual {v0, v1}, Landroid/widget/RadioGroup;->check(I)V
03013: 
03014:     goto :goto_e2
03015: 
03016:     .line 429
03017:     :cond_da
03018:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;
03019: 
03020:     const v1, 0x7f0a18c3
03021: 
03022:     invoke-virtual {v0, v1}, Landroid/widget/RadioGroup;->check(I)V
03023: 
03024:     .line 432
03025:     :goto_e2
03026:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z
03027: 
03028:     move-result v0
03029: 
03030:     if-nez v0, :cond_105
03031: 
03032:     .line 433
03033:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;
03034: 
03035:     invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getResources()Landroid/content/res/Resources;
03036: 
03037:     move-result-object v1
03038: 
03039:     const v2, 0x7f060b1a
```

### Excerpt 10 — lines 3126–3182

```smali
03126: 
03127:     :cond_143
03128:     return-void
03129: .end method
03130: 
03131: .method public onClick(Landroid/view/View;)V
03132:     .registers 4
03133: 
03134:     .line 327
03135:     invoke-virtual {p1}, Landroid/view/View;->getId()I
03136: 
03137:     move-result v0
03138: 
03139:     const v1, 0x7f0a247d
03140: 
03141:     if-ne v0, v1, :cond_d
03142: 
03143:     .line 328
03144:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->showIntervalDialog()V
03145: 
03146:     return-void
03147: 
03148:     .line 329
03149:     :cond_d
03150:     invoke-virtual {p1}, Landroid/view/View;->getId()I
03151: 
03152:     move-result v0
03153: 
03154:     const v1, 0x7f0a247e
03155: 
03156:     if-ne v0, v1, :cond_1a
03157: 
03158:     .line 330
03159:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->showStartDateDialog()V
03160: 
03161:     return-void
03162: 
03163:     .line 331
03164:     :cond_1a
03165:     invoke-virtual {p1}, Landroid/view/View;->getId()I
03166: 
03167:     move-result v0
03168: 
03169:     const v1, 0x7f0a274f
03170: 
03171:     if-ne v0, v1, :cond_27
03172: 
03173:     .line 332
03174:     invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->showSetTimeDialog()V
03175: 
03176:     return-void
03177: 
03178:     .line 333
03179:     :cond_27
03180:     invoke-virtual {p1}, Landroid/view/View;->getId()I
03181: 
03182:     move-result p1
```

### Excerpt 11 — lines 3376–3412

```smali
03376:     .line 374
03377:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;
03378: 
03379:     invoke-virtual {v0, v3}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V
03380: 
03381:     .line 375
03382:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->copyIV:Landroid/widget/ImageView;
03383: 
03384:     invoke-virtual {v0, v3}, Landroid/widget/ImageView;->setVisibility(I)V
03385: 
03386:     .line 376
03387:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numberText:Landroid/widget/TextView;
03388: 
03389:     invoke-virtual {v0, v1}, Landroid/widget/TextView;->setVisibility(I)V
03390: 
03391:     .line 377
03392:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;
03393: 
03394:     invoke-virtual {v0, v3}, Landroid/widget/EditText;->setEnabled(Z)V
03395: 
03396:     const/4 v0, 0x1
03397: 
03398:     .line 384
03399:     iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z
03400: 
03401:     .line 385
03402:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;
03403: 
03404:     new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda9;
03405: 
03406:     invoke-direct {v1, p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda9;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)V
03407: 
03408:     invoke-virtual {v0, v1}, Landroid/widget/RadioButton;->setOnClickListener(Landroid/view/View$OnClickListener;)V
03409: 
03410:     return-void
03411: .end method
03412: 
```

## `Iic800AddPlanPresenter.smali`

### Excerpt 1 — lines 280–353

```smali
00280:     .line 55
00281:     :cond_78
00282:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;
00283: 
00284:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00285: 
00286:     invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
00287: 
00288:     move-result v1
00289: 
00290:     iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00291: 
00292:     invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z
00293: 
00294:     move-result v2
00295: 
00296:     iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00297: 
00298:     invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z
00299: 
00300:     move-result v3
00301: 
00302:     invoke-interface {v0, v1, v2, v3}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;->setZoneNumberText(IZZ)V
00303: 
00304:     return-void
00305: 
00306:     .line 58
00307:     :cond_90
00308:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;
00309: 
00310:     invoke-interface {v0}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;->setZonesNumberText()V
00311: 
00312:     return-void
00313: .end method
00314: 
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
```

### Excerpt 2 — lines 426–558

```smali
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
00523: 
00524:     if-eqz p1, :cond_bc
00525: 
00526:     .line 184
00527:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00528: 
00529:     goto :goto_bf
00530: 
00531:     .line 186
00532:     :cond_bc
00533:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00534: 
00535:     .line 188
00536:     :goto_bf
00537:     const-string p1, "\u6211\u53d1\u768438"
00538: 
00539:     invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00540: 
00541:     move-result-object p2
00542: 
00543:     invoke-static {p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I
00544: 
00545:     .line 189
00546:     invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00547: 
00548:     move-result-object p1
00549: 
00550:     return-object p1
00551: .end method
00552: 
00553: 
00554: # virtual methods
00555: .method public getZoneNumbers()Ljava/util/List;
00556:     .registers 2
00557:     .annotation system Ldalvik/annotation/Signature;
00558:         value = {
```

### Excerpt 3 — lines 822–878

```smali
00822:     move-result-object v4
00823: 
00824:     invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
00825: 
00826:     .line 88
00827:     invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->apply()V
00828: 
00829:     .line 90
00830:     :cond_50
00831:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I
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
```

### Excerpt 4 — lines 887–940

```smali
00887: 
00888:     check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;
00889: 
00890:     .line 96
00891:     invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;->getNum()I
00892: 
00893:     move-result v4
00894: 
00895:     sub-int/2addr v4, v2
00896: 
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
00923: 
00924: .method public setZoneNumbers(Ljava/util/List;)V
00925:     .registers 2
00926:     .annotation system Ldalvik/annotation/Signature;
00927:         value = {
00928:             "(",
00929:             "Ljava/util/List<",
00930:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;",
00931:             ">;)V"
00932:         }
00933:     .end annotation
00934: 
00935:     .line 197
00936:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->zoneNumbers:Ljava/util/List;
00937: 
00938:     return-void
00939: .end method
00940: 
```

## `Iic800Model.smali`

### Excerpt 1 — lines 1–168

```smali
00001: .class public Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;
00002: .super Lcom/thingclips/smart/android/mvp/model/BaseModel;
00003: .source "Iic800Model.java"
00004: 
00005: # interfaces
00006: .implements Lcom/inkbird/inkbirdapp/device/iic800/model/IIic800Model;
00007: 
00008: 
00009: # direct methods
00010: .method public constructor <init>(Landroid/content/Context;Lcom/thingclips/smart/android/common/utils/SafeHandler;)V
00011:     .registers 3
00012: 
00013:     .line 18
00014:     invoke-direct {p0, p1, p2}, Lcom/thingclips/smart/android/mvp/model/BaseModel;-><init>(Landroid/content/Context;Lcom/thingclips/smart/android/common/utils/SafeHandler;)V
00015: 
00016:     return-void
00017: .end method
00018: 
00019: .method private getIntervalsNextTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)J
00020:     .registers 16
00021: 
00022:     .line 164
00023:     new-instance v0, Ljava/util/Date;
00024: 
00025:     invoke-direct {v0}, Ljava/util/Date;-><init>()V
00026: 
00027:     .line 165
00028:     invoke-virtual {v0}, Ljava/util/Date;->getTime()J
00029: 
00030:     move-result-wide v1
00031: 
00032:     .line 166
00033:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I
00034: 
00035:     move-result v3
00036: 
00037:     add-int/lit8 v3, v3, 0x64
00038: 
00039:     invoke-virtual {v0, v3}, Ljava/util/Date;->setYear(I)V
00040: 
00041:     .line 167
00042:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I
00043: 
00044:     move-result v3
00045: 
00046:     const/4 v4, 0x1
00047: 
00048:     sub-int/2addr v3, v4
00049: 
00050:     invoke-virtual {v0, v3}, Ljava/util/Date;->setMonth(I)V
00051: 
00052:     .line 168
00053:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I
00054: 
00055:     move-result v3
00056: 
00057:     invoke-virtual {v0, v3}, Ljava/util/Date;->setDate(I)V
00058: 
00059:     .line 169
00060:     invoke-virtual {v0}, Ljava/util/Date;->getTime()J
00061: 
00062:     move-result-wide v5
00063: 
00064:     const-wide/16 v7, 0x3e8
00065: 
00066:     .line 170
00067:     div-long v9, v1, v7
00068: 
00069:     div-long/2addr v5, v7
00070: 
00071:     sub-long/2addr v9, v5
00072: 
00073:     const-wide/32 v5, 0x15180
00074: 
00075:     div-long/2addr v9, v5
00076: 
00077:     long-to-int v0, v9
00078: 
00079:     .line 171
00080:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00081: 
00082:     move-result-object v3
00083: 
00084:     const-wide v5, 0x7fffffffffffffffL
00085: 
00086:     if-eqz v3, :cond_a1
00087: 
00088:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00089: 
00090:     move-result-object v3
00091: 
00092:     invoke-interface {v3}, Ljava/util/List;->size()I
00093: 
00094:     move-result v3
00095: 
00096:     if-lez v3, :cond_a1
00097: 
00098:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
00099: 
00100:     move-result v3
00101: 
00102:     if-lez v3, :cond_a1
00103: 
00104:     const/4 v3, 0x0
00105: 
00106:     move v7, v3
00107: 
00108:     move v8, v7
00109: 
00110:     :goto_4f
00111:     if-nez v7, :cond_a1
00112: 
00113:     .line 175
00114:     new-instance v9, Ljava/util/Date;
00115: 
00116:     invoke-direct {v9}, Ljava/util/Date;-><init>()V
00117: 
00118:     .line 176
00119:     invoke-virtual {v9}, Ljava/util/Date;->getDate()I
00120: 
00121:     move-result v10
00122: 
00123:     add-int/2addr v10, v8
00124: 
00125:     invoke-virtual {v9, v10}, Ljava/util/Date;->setDate(I)V
00126: 
00127:     if-ltz v0, :cond_9c
00128: 
00129:     .line 177
00130:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
00131: 
00132:     move-result v10
00133: 
00134:     rem-int v10, v0, v10
00135: 
00136:     if-nez v10, :cond_9c
00137: 
00138:     .line 178
00139:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
00140: 
00141:     move-result-object v10
00142: 
00143:     invoke-interface {v10}, Ljava/util/List;->iterator()Ljava/util/Iterator;
00144: 
00145:     move-result-object v10
00146: 
00147:     :cond_70
00148:     :goto_70
00149:     invoke-interface {v10}, Ljava/util/Iterator;->hasNext()Z
00150: 
00151:     move-result v11
00152: 
00153:     if-eqz v11, :cond_9c
00154: 
00155:     invoke-interface {v10}, Ljava/util/Iterator;->next()Ljava/lang/Object;
00156: 
00157:     move-result-object v11
00158: 
00159:     check-cast v11, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
00160: 
00161:     .line 179
00162:     invoke-virtual {v11}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I
00163: 
00164:     move-result v12
00165: 
00166:     invoke-virtual {v9, v12}, Ljava/util/Date;->setHours(I)V
00167: 
00168:     .line 180
```

### Excerpt 2 — lines 190–246

```smali
00190: 
00191:     move v7, v4
00192: 
00193:     move-wide v5, v11
00194: 
00195:     goto :goto_70
00196: 
00197:     :cond_9c
00198:     add-int/lit8 v0, v0, 0x1
00199: 
00200:     add-int/lit8 v8, v8, 0x1
00201: 
00202:     goto :goto_4f
00203: 
00204:     :cond_a1
00205:     return-wide v5
00206: .end method
00207: 
00208: .method private getOddEvenNextTime(ZLjava/util/List;)J
00209:     .registers 15
00210:     .annotation system Ldalvik/annotation/Signature;
00211:         value = {
00212:             "(Z",
00213:             "Ljava/util/List<",
00214:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
00215:             ">;)J"
00216:         }
00217:     .end annotation
00218: 
00219:     .line 136
00220:     new-instance v0, Ljava/util/Date;
00221: 
00222:     invoke-direct {v0}, Ljava/util/Date;-><init>()V
00223: 
00224:     invoke-virtual {v0}, Ljava/util/Date;->getTime()J
00225: 
00226:     move-result-wide v0
00227: 
00228:     const-wide v2, 0x7fffffffffffffffL
00229: 
00230:     if-eqz p2, :cond_6f
00231: 
00232:     .line 138
00233:     invoke-interface {p2}, Ljava/util/List;->size()I
00234: 
00235:     move-result v4
00236: 
00237:     if-lez v4, :cond_6f
00238: 
00239:     const/4 v4, 0x0
00240: 
00241:     move v5, v4
00242: 
00243:     move v6, v5
00244: 
00245:     :goto_19
00246:     if-nez v5, :cond_6f
```

### Excerpt 3 — lines 480–536

```smali
00480: 
00481:     :cond_69
00482:     add-int/lit8 v7, v7, 0x1
00483: 
00484:     goto :goto_19
00485: 
00486:     :cond_6c
00487:     return-wide v4
00488: .end method
00489: 
00490: 
00491: # virtual methods
00492: .method public onDestroy()V
00493:     .registers 1
00494: 
00495:     return-void
00496: .end method
00497: 
00498: .method public parseZoneInfo(Ljava/util/List;Ljava/lang/Object;Lcom/thingclips/smart/sdk/bean/DeviceBean;)Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00499:     .registers 21
00500:     .annotation system Ldalvik/annotation/Signature;
00501:         value = {
00502:             "(",
00503:             "Ljava/util/List<",
00504:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
00505:             ">;",
00506:             "Ljava/lang/Object;",
00507:             "Lcom/thingclips/smart/sdk/bean/DeviceBean;",
00508:             ")",
00509:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;"
00510:         }
00511:     .end annotation
00512: 
00513:     move-object/from16 v0, p1
00514: 
00515:     .line 28
00516:     invoke-virtual/range {p2 .. p2}, Ljava/lang/Object;->toString()Ljava/lang/String;
00517: 
00518:     move-result-object v1
00519: 
00520:     .line 29
00521:     new-instance v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00522: 
00523:     const/4 v3, 0x0
00524: 
00525:     const/4 v4, 0x2
00526: 
00527:     invoke-virtual {v1, v3, v4}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00528: 
00529:     move-result-object v5
00530: 
00531:     invoke-static {v5}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I
00532: 
00533:     move-result v5
00534: 
00535:     invoke-direct {v2, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;-><init>(I)V
00536: 
```

### Excerpt 4 — lines 699–877

```smali
00699:     :cond_9e
00700:     invoke-virtual {v0, v9}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setStartTimeList(Ljava/util/List;)V
00701: 
00702:     const/16 v3, 0x1e
00703: 
00704:     .line 59
00705:     invoke-virtual {v1, v10, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00706: 
00707:     move-result-object v5
00708: 
00709:     invoke-static {v5, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00710: 
00711:     move-result-object v5
00712: 
00713:     invoke-virtual {v5}, Ljava/lang/Integer;->intValue()I
00714: 
00715:     move-result v5
00716: 
00717:     invoke-virtual {v0, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V
00718: 
00719:     const/16 v5, 0x20
00720: 
00721:     .line 60
00722:     invoke-virtual {v1, v3, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00723: 
00724:     move-result-object v3
00725: 
00726:     invoke-static {v3, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00727: 
00728:     move-result-object v3
00729: 
00730:     invoke-virtual {v3}, Ljava/lang/Integer;->intValue()I
00731: 
00732:     move-result v3
00733: 
00734:     invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleDay(I)V
00735: 
00736:     const/16 v3, 0x22
00737: 
00738:     .line 61
00739:     invoke-virtual {v1, v5, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00740: 
00741:     move-result-object v5
00742: 
00743:     invoke-static {v5, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00744: 
00745:     move-result-object v5
00746: 
00747:     invoke-virtual {v5}, Ljava/lang/Integer;->intValue()I
00748: 
00749:     move-result v5
00750: 
00751:     invoke-virtual {v0, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalYear(I)V
00752: 
00753:     const/16 v5, 0x24
00754: 
00755:     .line 62
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
00801: 
00802:     const/4 v10, 0x1
00803: 
00804:     if-eqz v3, :cond_109
00805: 
00806:     move v3, v10
00807: 
00808:     goto :goto_10a
00809: 
00810:     :cond_109
00811:     const/4 v3, 0x0
00812: 
00813:     :goto_10a
00814:     invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setEnable(Z)V
00815: 
00816:     .line 65
00817:     invoke-virtual {v1, v5, v6}, Ljava/lang/String;->substring(II)Ljava/lang/String;
00818: 
00819:     move-result-object v1
00820: 
00821:     invoke-static {v1, v8}, Ljava/lang/Integer;->valueOf(Ljava/lang/String;I)Ljava/lang/Integer;
00822: 
00823:     move-result-object v1
00824: 
00825:     invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I
00826: 
00827:     move-result v1
00828: 
00829:     if-eqz v1, :cond_11d
00830: 
00831:     move v1, v10
00832: 
00833:     goto :goto_11e
00834: 
00835:     :cond_11d
00836:     const/4 v1, 0x0
00837: 
00838:     :goto_11e
00839:     invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setSeaAdjSwitch(Z)V
00840: 
00841:     if-eqz v7, :cond_12f
00842: 
00843:     .line 67
00844:     invoke-interface {v9}, Ljava/util/List;->size()I
00845: 
00846:     move-result v1
00847: 
00848:     if-eqz v1, :cond_12f
00849: 
00850:     move-object/from16 v1, p0
00851: 
00852:     .line 68
00853:     invoke-virtual {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->setNextTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
00854: 
00855:     goto :goto_131
00856: 
00857:     :cond_12f
00858:     move-object/from16 v1, p0
00859: 
00860:     :goto_131
00861:     if-eqz p3, :cond_1af
00862: 
00863:     .line 72
00864:     invoke-virtual/range {p3 .. p3}, Lcom/thingclips/smart/sdk/bean/DeviceBean;->getDps()Ljava/util/Map;
00865: 
00866:     move-result-object v3
00867: 
00868:     const-string v5, "101"
00869: 
00870:     invoke-interface {v3, v5}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;
00871: 
00872:     move-result-object v3
00873: 
00874:     if-eqz v3, :cond_144
00875: 
00876:     .line 73
00877:     invoke-virtual {v3}, Ljava/lang/Object;->toString()Ljava/lang/String;
```

### Excerpt 5 — lines 1009–1118

```smali
01009: 
01010:     :cond_1ab
01011:     move v3, v10
01012: 
01013:     :goto_1ac
01014:     invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setWait(Z)V
01015: 
01016:     :cond_1af
01017:     return-object v0
01018: 
01019:     :goto_1b0
01020:     return-object v2
01021: .end method
01022: 
01023: .method public setNextTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
01024:     .registers 4
01025: 
01026:     .line 93
01027:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
01028: 
01029:     move-result v0
01030: 
01031:     if-nez v0, :cond_16
01032: 
01033:     .line 94
01034:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I
01035: 
01036:     move-result v0
01037: 
01038:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01039: 
01040:     move-result-object v1
01041: 
01042:     invoke-direct {p0, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->getWeekNextTime(ILjava/util/List;)J
01043: 
01044:     move-result-wide v0
01045: 
01046:     invoke-virtual {p1, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setNextTime(J)V
01047: 
01048:     return-void
01049: 
01050:     .line 95
01051:     :cond_16
01052:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
01053: 
01054:     move-result v0
01055: 
01056:     const/4 v1, 0x1
01057: 
01058:     if-ne v0, v1, :cond_29
01059: 
01060:     .line 96
01061:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01062: 
01063:     move-result-object v0
01064: 
01065:     invoke-direct {p0, v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->getOddEvenNextTime(ZLjava/util/List;)J
01066: 
01067:     move-result-wide v0
01068: 
01069:     invoke-virtual {p1, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setNextTime(J)V
01070: 
01071:     return-void
01072: 
01073:     .line 97
01074:     :cond_29
01075:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
01076: 
01077:     move-result v0
01078: 
01079:     const/4 v1, 0x2
01080: 
01081:     if-ne v0, v1, :cond_3d
01082: 
01083:     const/4 v0, 0x0
01084: 
01085:     .line 98
01086:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;
01087: 
01088:     move-result-object v1
01089: 
01090:     invoke-direct {p0, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->getOddEvenNextTime(ZLjava/util/List;)J
01091: 
01092:     move-result-wide v0
01093: 
01094:     invoke-virtual {p1, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setNextTime(J)V
01095: 
01096:     return-void
01097: 
01098:     .line 99
01099:     :cond_3d
01100:     invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I
01101: 
01102:     move-result v0
01103: 
01104:     const/4 v1, 0x3
01105: 
01106:     if-ne v0, v1, :cond_4b
01107: 
01108:     .line 100
01109:     invoke-direct {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;->getIntervalsNextTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)J
01110: 
01111:     move-result-wide v0
01112: 
01113:     invoke-virtual {p1, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setNextTime(J)V
01114: 
01115:     :cond_4b
01116:     return-void
01117: .end method
01118: 
```

## `Iic800SchedulePresenter.smali`

### Excerpt 1 — lines 75–131

```smali
00075: .method static synthetic access$000(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;)Lcom/thingclips/smart/android/common/utils/SafeHandler;
00076:     .registers 1
00077: 
00078:     .line 43
00079:     iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mHandler:Lcom/thingclips/smart/android/common/utils/SafeHandler;
00080: 
00081:     return-object p0
00082: .end method
00083: 
00084: .method static synthetic access$100(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;)Lcom/thingclips/smart/android/common/utils/SafeHandler;
00085:     .registers 1
00086: 
00087:     .line 43
00088:     iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mHandler:Lcom/thingclips/smart/android/common/utils/SafeHandler;
00089: 
00090:     return-object p0
00091: .end method
00092: 
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
```

### Excerpt 2 — lines 204–336

```smali
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
00301: 
00302:     if-eqz p1, :cond_bc
00303: 
00304:     .line 154
00305:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00306: 
00307:     goto :goto_bf
00308: 
00309:     .line 156
00310:     :cond_bc
00311:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
00312: 
00313:     .line 158
00314:     :goto_bf
00315:     invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
00316: 
00317:     move-result-object p1
00318: 
00319:     return-object p1
00320: .end method
00321: 
00322: .method private startCrop(Landroid/net/Uri;)V
00323:     .registers 8
00324: 
00325:     .line 300
00326:     :try_start_0
00327:     new-instance v0, Ljava/io/File;
00328: 
00329:     iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;
00330: 
00331:     invoke-virtual {v1}, Landroidx/fragment/app/Fragment;->requireContext()Landroid/content/Context;
00332: 
00333:     move-result-object v1
00334: 
00335:     const-string v2, "image"
00336: 
```

### Excerpt 3 — lines 1260–1316

```smali
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
01296: 
01297: .method public setScheduleTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;I)V
01298:     .registers 8
01299: 
01300:     .line 163
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
```

### Excerpt 4 — lines 1414–1546

```smali
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
01511: 
01512:     if-eqz p1, :cond_c0
01513: 
01514:     .line 192
01515:     invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01516: 
01517:     goto :goto_c3
01518: 
01519:     .line 194
01520:     :cond_c0
01521:     invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
01522: 
01523:     .line 197
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
```

## `IicZoneBean.smali`

### Excerpt 1 — lines 1–58

```smali
00001: .class public Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
00002: .super Ljava/lang/Object;
00003: .source "IicZoneBean.java"
00004: 
00005: # interfaces
00006: .implements Ljava/io/Serializable;
00007: 
00008: 
00009: # instance fields
00010: .field private adjustValue:I
00011: 
00012: .field private alarm:Z
00013: 
00014: .field private enable:Z
00015: 
00016: .field private intervalDay:I
00017: 
00018: .field private intervalMonth:I
00019: 
00020: .field private intervalYear:I
00021: 
00022: .field private isWait:Z
00023: 
00024: .field private manualMode:I
00025: 
00026: .field private manualTime:I
00027: 
00028: .field private name:Ljava/lang/String;
00029: 
00030: .field private nextTime:J
00031: 
00032: .field private remainTime:I
00033: 
00034: .field private runTime:I
00035: 
00036: .field private scheduleDay:I
00037: 
00038: .field private scheduleMode:I
00039: 
00040: .field private seaAdjSwitch:Z
00041: 
00042: .field private startTimeList:Ljava/util/List;
00043:     .annotation system Ldalvik/annotation/Signature;
00044:         value = {
00045:             "Ljava/util/List<",
00046:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
00047:             ">;"
00048:         }
00049:     .end annotation
00050: .end field
00051: 
00052: .field private totalSeaSwitch:Z
00053: 
00054: .field private wateredTime:I
00055: 
00056: .field private wateringSwitch:Z
00057: 
00058: .field private workMode:Ljava/lang/String;
```

### Excerpt 2 — lines 113–191

```smali
00113:     .line 238
00114:     :cond_10
00115:     invoke-super {p0, p1}, Ljava/lang/Object;->equals(Ljava/lang/Object;)Z
00116: 
00117:     move-result p1
00118: 
00119:     return p1
00120: .end method
00121: 
00122: .method public getAdjustValue()I
00123:     .registers 2
00124: 
00125:     .line 153
00126:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->adjustValue:I
00127: 
00128:     return v0
00129: .end method
00130: 
00131: .method public getIntervalDay()I
00132:     .registers 2
00133: 
00134:     .line 129
00135:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalDay:I
00136: 
00137:     return v0
00138: .end method
00139: 
00140: .method public getIntervalMonth()I
00141:     .registers 2
00142: 
00143:     .line 121
00144:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalMonth:I
00145: 
00146:     return v0
00147: .end method
00148: 
00149: .method public getIntervalYear()I
00150:     .registers 2
00151: 
00152:     .line 113
00153:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalYear:I
00154: 
00155:     return v0
00156: .end method
00157: 
00158: .method public getManualMode()I
00159:     .registers 2
00160: 
00161:     .line 201
00162:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualMode:I
00163: 
00164:     return v0
00165: .end method
00166: 
00167: .method public getManualTime()I
00168:     .registers 2
00169: 
00170:     .line 209
00171:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualTime:I
00172: 
00173:     return v0
00174: .end method
00175: 
00176: .method public getName()Ljava/lang/String;
00177:     .registers 2
00178: 
00179:     .line 73
00180:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->name:Ljava/lang/String;
00181: 
00182:     return-object v0
00183: .end method
00184: 
00185: .method public getNextTime()J
00186:     .registers 3
00187: 
00188:     .line 145
00189:     iget-wide v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->nextTime:J
00190: 
00191:     return-wide v0
```

### Excerpt 3 — lines 194–259

```smali
00194: .method public getRemainTime()I
00195:     .registers 2
00196: 
00197:     .line 185
00198:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->remainTime:I
00199: 
00200:     return v0
00201: .end method
00202: 
00203: .method public getRunTime()I
00204:     .registers 2
00205: 
00206:     .line 81
00207:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->runTime:I
00208: 
00209:     return v0
00210: .end method
00211: 
00212: .method public getScheduleDay()I
00213:     .registers 2
00214: 
00215:     .line 105
00216:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleDay:I
00217: 
00218:     return v0
00219: .end method
00220: 
00221: .method public getScheduleMode()I
00222:     .registers 2
00223: 
00224:     .line 97
00225:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleMode:I
00226: 
00227:     return v0
00228: .end method
00229: 
00230: .method public getStartTimeList()Ljava/util/List;
00231:     .registers 2
00232:     .annotation system Ldalvik/annotation/Signature;
00233:         value = {
00234:             "()",
00235:             "Ljava/util/List<",
00236:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
00237:             ">;"
00238:         }
00239:     .end annotation
00240: 
00241:     .line 89
00242:     iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->startTimeList:Ljava/util/List;
00243: 
00244:     return-object v0
00245: .end method
00246: 
00247: .method public getWateredTime()I
00248:     .registers 2
00249: 
00250:     .line 193
00251:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateredTime:I
00252: 
00253:     return v0
00254: .end method
00255: 
00256: .method public getWorkMode()Ljava/lang/String;
00257:     .registers 2
00258: 
00259:     .line 177
```

### Excerpt 4 — lines 265–415

```smali
00265: .method public getZoneId()I
00266:     .registers 2
00267: 
00268:     .line 65
00269:     iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I
00270: 
00271:     return v0
00272: .end method
00273: 
00274: .method public isAlarm()Z
00275:     .registers 2
00276: 
00277:     .line 53
00278:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->alarm:Z
00279: 
00280:     return v0
00281: .end method
00282: 
00283: .method public isEnable()Z
00284:     .registers 2
00285: 
00286:     .line 217
00287:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->enable:Z
00288: 
00289:     return v0
00290: .end method
00291: 
00292: .method public isSeaAdjSwitch()Z
00293:     .registers 2
00294: 
00295:     .line 137
00296:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->seaAdjSwitch:Z
00297: 
00298:     return v0
00299: .end method
00300: 
00301: .method public isTotalSeaSwitch()Z
00302:     .registers 2
00303: 
00304:     .line 161
00305:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->totalSeaSwitch:Z
00306: 
00307:     return v0
00308: .end method
00309: 
00310: .method public isWait()Z
00311:     .registers 2
00312: 
00313:     .line 225
00314:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWait:Z
00315: 
00316:     return v0
00317: .end method
00318: 
00319: .method public isWateringSwitch()Z
00320:     .registers 2
00321: 
00322:     .line 169
00323:     iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateringSwitch:Z
00324: 
00325:     return v0
00326: .end method
00327: 
00328: .method public setAdjustValue(I)V
00329:     .registers 2
00330: 
00331:     .line 157
00332:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->adjustValue:I
00333: 
00334:     return-void
00335: .end method
00336: 
00337: .method public setAlarm(Z)V
00338:     .registers 2
00339: 
00340:     .line 57
00341:     iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->alarm:Z
00342: 
00343:     return-void
00344: .end method
00345: 
00346: .method public setEnable(Z)V
00347:     .registers 2
00348: 
00349:     .line 221
00350:     iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->enable:Z
00351: 
00352:     return-void
00353: .end method
00354: 
00355: .method public setIntervalDay(I)V
00356:     .registers 2
00357: 
00358:     .line 133
00359:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalDay:I
00360: 
00361:     return-void
00362: .end method
00363: 
00364: .method public setIntervalMonth(I)V
00365:     .registers 2
00366: 
00367:     .line 125
00368:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalMonth:I
00369: 
00370:     return-void
00371: .end method
00372: 
00373: .method public setIntervalYear(I)V
00374:     .registers 2
00375: 
00376:     .line 117
00377:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalYear:I
00378: 
00379:     return-void
00380: .end method
00381: 
00382: .method public setManualMode(I)V
00383:     .registers 2
00384: 
00385:     .line 205
00386:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualMode:I
00387: 
00388:     return-void
00389: .end method
00390: 
00391: .method public setManualTime(I)V
00392:     .registers 2
00393: 
00394:     .line 213
00395:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualTime:I
00396: 
00397:     return-void
00398: .end method
00399: 
00400: .method public setName(Ljava/lang/String;)V
00401:     .registers 2
00402: 
00403:     .line 77
00404:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->name:Ljava/lang/String;
00405: 
00406:     return-void
00407: .end method
00408: 
00409: .method public setNextTime(J)V
00410:     .registers 3
00411: 
00412:     .line 149
00413:     iput-wide p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->nextTime:J
00414: 
00415:     return-void
```

### Excerpt 5 — lines 418–492

```smali
00418: .method public setRemainTime(I)V
00419:     .registers 2
00420: 
00421:     .line 189
00422:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->remainTime:I
00423: 
00424:     return-void
00425: .end method
00426: 
00427: .method public setRunTime(I)V
00428:     .registers 2
00429: 
00430:     .line 85
00431:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->runTime:I
00432: 
00433:     return-void
00434: .end method
00435: 
00436: .method public setScheduleDay(I)V
00437:     .registers 2
00438: 
00439:     .line 109
00440:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleDay:I
00441: 
00442:     return-void
00443: .end method
00444: 
00445: .method public setScheduleMode(I)V
00446:     .registers 2
00447: 
00448:     .line 101
00449:     iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleMode:I
00450: 
00451:     return-void
00452: .end method
00453: 
00454: .method public setSeaAdjSwitch(Z)V
00455:     .registers 2
00456: 
00457:     .line 141
00458:     iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->seaAdjSwitch:Z
00459: 
00460:     return-void
00461: .end method
00462: 
00463: .method public setStartTimeList(Ljava/util/List;)V
00464:     .registers 2
00465:     .annotation system Ldalvik/annotation/Signature;
00466:         value = {
00467:             "(",
00468:             "Ljava/util/List<",
00469:             "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
00470:             ">;)V"
00471:         }
00472:     .end annotation
00473: 
00474:     .line 93
00475:     iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->startTimeList:Ljava/util/List;
00476: 
00477:     return-void
00478: .end method
00479: 
00480: .method public setTotalSeaSwitch(Z)V
00481:     .registers 2
00482: 
00483:     .line 165
00484:     iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->totalSeaSwitch:Z
00485: 
00486:     return-void
00487: .end method
00488: 
00489: .method public setWait(Z)V
00490:     .registers 2
00491: 
00492:     .line 229
```

Total matched lines: **122**
