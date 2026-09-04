# Iic800AddPlanActivity

## lines 128-134: `.method public static synthetic $r8$lambda$OoqsaX1aeD5dZkFJUHKebjNNxcE(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;Landroid/view/View;)V`

```smali
.method public static synthetic $r8$lambda$OoqsaX1aeD5dZkFJUHKebjNNxcE(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;Landroid/view/View;)V
    .registers 3

    invoke-direct {p0, p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->lambda$initDataViews$3(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;Landroid/view/View;)V

    return-void
.end method
```

## lines 152-158: `.method public static synthetic $r8$lambda$WRpZsTGuQba14-O_SRLP0wqJUQg(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V`

```smali
.method public static synthetic $r8$lambda$WRpZsTGuQba14-O_SRLP0wqJUQg(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V
    .registers 4

    invoke-direct {p0, p1, p2, p3}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->lambda$showSetTimeDialog$9(Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V

    return-void
.end method
```

## lines 353-736: `.method private initViews()V`

```smali
.method private initViews()V
    .registers 4

    const v0, 0x7f0a26a7

    .line 110
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->resetText:Landroid/widget/TextView;

    const v0, 0x7f0a2662

    .line 111
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rainText:Landroid/widget/TextView;

    const v0, 0x7f0a2979

    .line 112
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numberText:Landroid/widget/TextView;

    const v0, 0x7f0a2bca

    .line 113
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroidx/recyclerview/widget/RecyclerView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;

    const v0, 0x7f0a26d2

    .line 114
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rsbTipText:Landroid/widget/TextView;

    const v0, 0x7f0a07b4

    .line 115
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/EditText;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;

    const v0, 0x7f0a195c

    .line 116
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    const v0, 0x7f0a1954

    .line 117
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/RadioGroup;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;

    const v0, 0x7f0a18c4

    .line 118
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/RadioButton;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;

    const v0, 0x7f0a1bc2

    .line 119
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroidx/recyclerview/widget/RecyclerView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;

    const v0, 0x7f0a1367

    .line 120
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/LinearLayout;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsLayout:Landroid/widget/LinearLayout;

    const v0, 0x7f0a247d

    .line 121
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;

    const v0, 0x7f0a247e

    .line 122
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;

    const v0, 0x7f0a1b0a

    .line 123
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Lcom/jaygoo/widget/RangeSeekBar;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;

    const v0, 0x7f0a274f

    .line 124
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/TextView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;

    const v0, 0x7f0a13b5

    .line 125
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/LinearLayout;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->contentLayout:Landroid/widget/LinearLayout;

    const v0, 0x7f0a1bb6

    .line 126
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroidx/recyclerview/widget/RecyclerView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startRv:Landroidx/recyclerview/widget/RecyclerView;

    const v0, 0x7f0a04e8

    .line 127
    invoke-virtual {p0, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->findViewById(I)Landroid/view/View;

    move-result-object v0

    check-cast v0, Landroid/widget/ImageView;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->copyIV:Landroid/widget/ImageView;

    .line 129
    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getPackageName()Ljava/lang/String;

    move-result-object v0

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object v0

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sharedPreferences:Landroid/content/SharedPreferences;

    .line 130
    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    const-string v1, "devId"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->devId:Ljava/lang/String;

    .line 131
    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    const-string v1, "zoneBeans"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->getSerializableExtra(Ljava/lang/String;)Ljava/io/Serializable;

    move-result-object v0

    check-cast v0, Ljava/util/List;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->checkZones:Ljava/util/List;

    .line 132
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->haveCheckZones:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->clear()V

    .line 133
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->checkZones:Ljava/util/List;

    if-eqz v0, :cond_125

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    if-eqz v0, :cond_125

    .line 134
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->checkZones:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object v0

    :cond_100
    :goto_100
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v1

    if-eqz v1, :cond_122

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    .line 135
    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    if-eqz v2, :cond_100

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-eqz v2, :cond_100

    .line 136
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->haveCheckZones:Ljava/util/List;

    invoke-interface {v2, v1}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    goto :goto_100

    :cond_122
    const/4 v0, 0x1

    .line 139
    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z

    .line 141
    :cond_125
    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$1;

    const/4 v1, 0x4

    invoke-direct {v0, p0, p0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$1;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/content/Context;I)V

    .line 147
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setLayoutManager(Landroidx/recyclerview/widget/RecyclerView$LayoutManager;)V

    .line 148
    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;

    invoke-direct {v0, p0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;-><init>(Landroid/content/Context;)V

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;

    .line 149
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekRv:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setAdapter(Landroidx/recyclerview/widget/RecyclerView$Adapter;)V

    .line 151
    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$2;

    const/4 v1, 0x3

    invoke-direct {v0, p0, p0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$2;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/content/Context;I)V

    .line 157
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startRv:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setLayoutManager(Landroidx/recyclerview/widget/RecyclerView$LayoutManager;)V

    .line 158
    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    invoke-direct {v0, p0, p0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;-><init>(Landroid/content/Context;Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter$StartTimeAddListener;)V

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    .line 159
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startRv:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setAdapter(Landroidx/recyclerview/widget/RecyclerView$Adapter;)V

    const/4 v0, 0x2

    .line 161
    invoke-static {}, Ljava/util/Locale;->getDefault()Ljava/util/Locale;

    move-result-object v1

    invoke-static {v0, v1}, Ljava/text/DateFormat;->getDateInstance(ILjava/util/Locale;)Ljava/text/DateFormat;

    move-result-object v0

    .line 162
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;

    new-instance v2, Ljava/util/Date;

    invoke-direct {v2}, Ljava/util/Date;-><init>()V

    invoke-virtual {v0, v2}, Ljava/text/DateFormat;->format(Ljava/util/Date;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    return-void
.end method
```

## lines 738-760: `.method private synthetic lambda$initDataViews$3(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;Landroid/view/View;)V`

```smali
.method private synthetic lambda$initDataViews$3(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;Landroid/view/View;)V
    .registers 3

    .line 438
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result p1

    if-nez p1, :cond_11

    .line 439
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;

    const p2, 0x7f0a18c3

    invoke-virtual {p1, p2}, Landroid/widget/RadioGroup;->check(I)V

    .line 440
    invoke-direct {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->showRainSensorDialog()V

    :cond_11
    return-void
.end method
```

## lines 967-989: `.method private synthetic lambda$showCopyZonesDialog$13(Landroid/app/Dialog;Lcom/inkbird/inkbirdapp/device/iic800/adapter/CopyLicZoneBeanAdapter;Landroid/view/View;)V`

```smali
.method private synthetic lambda$showCopyZonesDialog$13(Landroid/app/Dialog;Lcom/inkbird/inkbirdapp/device/iic800/adapter/CopyLicZoneBeanAdapter;Landroid/view/View;)V
    .registers 4

    .line 710
    invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V

    .line 711
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->haveCheckZones:Ljava/util/List;

    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/CopyLicZoneBeanAdapter;->getSelectIndex()I

    move-result p2

    invoke-interface {p1, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->initDataViews(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V

    return-void
.end method
```

## lines 991-1013: `.method private synthetic lambda$showIntervalDialog$6(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V`

```smali
.method private synthetic lambda$showIntervalDialog$6(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V
    .registers 5

    .line 558
    invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V

    .line 559
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;

    invoke-virtual {p3}, Lcom/weigan/loopview/LoopView;->getSelectedItem()I

    move-result p3

    invoke-interface {p2, p3}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p2

    check-cast p2, Ljava/lang/CharSequence;

    invoke-virtual {p1, p2}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    return-void
.end method
```

## lines 1056-1097: `.method private synthetic lambda$showSetTimeDialog$9(Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V`

```smali
.method private synthetic lambda$showSetTimeDialog$9(Landroid/app/Dialog;Landroid/widget/EditText;Landroid/view/View;)V
    .registers 4

    .line 661
    invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V

    .line 662
    invoke-virtual {p2}, Landroid/widget/EditText;->getText()Landroid/text/Editable;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object p1

    .line 663
    invoke-static {p1}, Landroid/text/TextUtils;->isEmpty(Ljava/lang/CharSequence;)Z

    move-result p2

    if-nez p2, :cond_1e

    .line 664
    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    if-gez p1, :cond_18

    const/4 p1, 0x0

    .line 668
    :cond_18
    iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;

    int-to-float p1, p1

    invoke-virtual {p2, p1}, Lcom/jaygoo/widget/RangeSeekBar;->setProgress(F)V

    :cond_1e
    return-void
.end method
```

## lines 1207-1283: `.method private synthetic lambda$showTimeDialog$5(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V`

```smali
.method private synthetic lambda$showTimeDialog$5(Landroid/app/Dialog;Ljava/util/List;Lcom/weigan/loopview/LoopView;Ljava/util/List;Lcom/weigan/loopview/LoopView;Landroid/view/View;)V
    .registers 7

    .line 517
    invoke-virtual {p1}, Landroid/app/Dialog;->dismiss()V

    .line 518
    invoke-virtual {p3}, Lcom/weigan/loopview/LoopView;->getSelectedItem()I

    move-result p1

    invoke-interface {p2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Ljava/lang/String;

    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    .line 519
    invoke-virtual {p5}, Lcom/weigan/loopview/LoopView;->getSelectedItem()I

    move-result p2

    invoke-interface {p4, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p2

    check-cast p2, Ljava/lang/String;

    invoke-static {p2}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p2

    const/4 p3, -0x1

    if-eq p1, p3, :cond_41

    if-ne p2, p3, :cond_25

    goto :goto_41

    .line 523
    :cond_25
    iget-object p3, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    new-instance p4, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-direct {p4, p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;-><init>(II)V

    invoke-virtual {p3, p4}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;->addStartTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;)Z

    move-result p1

    if-nez p1, :cond_41

    const p1, 0x7f141296

    .line 524
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    const/4 p2, 0x1

    invoke-static {p0, p1, p2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    :cond_41
    :goto_41
    return-void
.end method
```

## lines 1707-1804: `.method private showSetTimeDialog()V`

```smali
.method private showSetTimeDialog()V
    .registers 5

    .line 623
    new-instance v0, Landroid/app/Dialog;

    invoke-direct {v0, p0}, Landroid/app/Dialog;-><init>(Landroid/content/Context;)V

    const v1, 0x7f0d0501

    const/4 v2, 0x0

    .line 624
    invoke-static {p0, v1, v2}, Landroid/view/View;->inflate(Landroid/content/Context;ILandroid/view/ViewGroup;)Landroid/view/View;

    move-result-object v1

    .line 625
    invoke-virtual {v0, v1}, Landroid/app/Dialog;->setContentView(Landroid/view/View;)V

    .line 627
    invoke-virtual {v0}, Landroid/app/Dialog;->getWindow()Landroid/view/Window;

    move-result-object v1

    const/4 v2, -0x1

    const/4 v3, -0x2

    .line 628
    invoke-virtual {v1, v2, v3}, Landroid/view/Window;->setLayout(II)V

    .line 629
    invoke-virtual {v0}, Landroid/app/Dialog;->show()V

    const v2, 0x7f0a07ad

    .line 630
    invoke-virtual {v0, v2}, Landroid/app/Dialog;->findViewById(I)Landroid/view/View;

    move-result-object v2

    check-cast v2, Landroid/widget/EditText;

    .line 631
    invoke-virtual {v2}, Landroid/widget/EditText;->requestFocus()Z

    const/4 v3, 0x5

    .line 632
    invoke-virtual {v1, v3}, Landroid/view/Window;->setSoftInputMode(I)V

    .line 633
    invoke-virtual {v2}, Landroid/widget/EditText;->getText()Landroid/text/Editable;

    move-result-object v1

    invoke-interface {v1}, Landroid/text/Editable;->length()I

    move-result v1

    invoke-virtual {v2, v1}, Landroid/widget/EditText;->setSelection(I)V

    .line 634
    new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$5;

    invoke-direct {v1, p0, v2}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$5;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/widget/EditText;)V

    invoke-virtual {v2, v1}, Landroid/widget/EditText;->addTextChangedListener(Landroid/text/TextWatcher;)V

    const v1, 0x7f0a290e

    .line 659
    invoke-virtual {v0, v1}, Landroid/app/Dialog;->findViewById(I)Landroid/view/View;

    move-result-object v1

    new-instance v3, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda10;

    invoke-direct {v3, v0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda10;-><init>(Landroid/app/Dialog;)V

    invoke-virtual {v1, v3}, Landroid/view/View;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    const v1, 0x7f0a290f

    .line 660
    invoke-virtual {v0, v1}, Landroid/app/Dialog;->findViewById(I)Landroid/view/View;

    move-result-object v1

    new-instance v3, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda11;

    invoke-direct {v3, p0, v0, v2}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda11;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Landroid/app/Dialog;Landroid/widget/EditText;)V

    invoke-virtual {v1, v3}, Landroid/view/View;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    return-void
.end method
```

## lines 2213-2763: `.method public done(Landroid/view/View;)V`

```smali
.method public done(Landroid/view/View;)V
    .registers 9

    .line 254
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {p1}, Landroidx/recyclerview/widget/RecyclerView;->getVisibility()I

    move-result p1

    const/4 v0, 0x1

    if-nez p1, :cond_45

    .line 255
    new-instance p1, Ljava/util/ArrayList;

    invoke-direct {p1}, Ljava/util/ArrayList;-><init>()V

    .line 256
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->zoneNumbers:Ljava/util/List;

    invoke-interface {v1}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object v1

    :cond_14
    :goto_14
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_2a

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;

    .line 257
    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;->isSelect()Z

    move-result v3

    if-eqz v3, :cond_14

    .line 258
    invoke-interface {p1, v2}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    goto :goto_14

    .line 261
    :cond_2a
    invoke-interface {p1}, Ljava/util/List;->size()I

    move-result v1

    if-eqz v1, :cond_36

    .line 262
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->presenter:Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;

    invoke-virtual {v1, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setZoneNumbers(Ljava/util/List;)V

    goto :goto_45

    :cond_36
    const p1, 0x7f141b9a

    .line 264
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    return-void

    .line 268
    :cond_45
    :goto_45
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;

    invoke-virtual {p1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    if-nez p1, :cond_68

    iget-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z

    if-eqz p1, :cond_68

    const p1, 0x7f141298

    .line 269
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    return-void

    .line 271
    :cond_68
    new-instance p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numberText:Landroid/widget/TextView;

    invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v1

    invoke-direct {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;-><init>(I)V

    .line 272
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;

    invoke-virtual {v1}, Landroid/widget/EditText;->getText()Landroid/text/Editable;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setName(Ljava/lang/String;)V

    .line 273
    iget-boolean v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setEnable(Z)V

    .line 274
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->timeText:Landroid/widget/TextView;

    invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setRunTime(I)V

    .line 275
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I

    move-result v1

    const v2, 0x7f0a189c

    const/4 v3, 0x3

    const/4 v4, 0x0

    if-ne v1, v2, :cond_b9

    .line 276
    invoke-virtual {p1, v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V

    .line 277
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->getChecks()I

    move-result v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleDay(I)V

    goto/16 :goto_12c

    .line 278
    :cond_b9
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I

    move-result v1

    const v2, 0x7f0a18ba

    if-ne v1, v2, :cond_c8

    .line 279
    invoke-virtual {p1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V

    goto :goto_12c

    .line 280
    :cond_c8
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I

    move-result v1

    const v2, 0x7f0a18a2

    const/4 v5, 0x2

    if-ne v1, v2, :cond_d8

    .line 281
    invoke-virtual {p1, v5}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V

    goto :goto_12c

    .line 282
    :cond_d8
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->getCheckedRadioButtonId()I

    move-result v1

    const v2, 0x7f0a18a8

    if-ne v1, v2, :cond_12c

    .line 283
    invoke-virtual {p1, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleMode(I)V

    .line 284
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;

    invoke-virtual {v1}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setScheduleDay(I)V

    .line 286
    :try_start_f7
    invoke-static {}, Ljava/util/Locale;->getDefault()Ljava/util/Locale;

    move-result-object v1

    invoke-static {v5, v1}, Ljava/text/DateFormat;->getDateInstance(ILjava/util/Locale;)Ljava/text/DateFormat;

    move-result-object v1

    .line 287
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;

    invoke-virtual {v2}, Landroid/widget/TextView;->getText()Ljava/lang/CharSequence;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/text/DateFormat;->parse(Ljava/lang/String;)Ljava/util/Date;

    move-result-object v1

    if-eqz v1, :cond_12c

    .line 289
    invoke-virtual {v1}, Ljava/util/Date;->getYear()I

    move-result v2

    add-int/lit8 v2, v2, -0x64

    invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalYear(I)V

    .line 290
    invoke-virtual {v1}, Ljava/util/Date;->getMonth()I

    move-result v2

    add-int/2addr v2, v0

    invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalMonth(I)V

    .line 291
    invoke-virtual {v1}, Ljava/util/Date;->getDate()I

    move-result v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setIntervalDay(I)V
    :try_end_127
    .catch Ljava/text/ParseException; {:try_start_f7 .. :try_end_127} :catch_128

    goto :goto_12c

    :catch_128
    move-exception v1

    .line 294
    invoke-virtual {v1}, Ljava/text/ParseException;->printStackTrace()V

    .line 297
    :cond_12c
    :goto_12c
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sharedPreferences:Landroid/content/SharedPreferences;

    invoke-interface {v1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object v1

    .line 298
    iget-boolean v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z

    invoke-virtual {p1, v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setTotalSeaSwitch(Z)V

    .line 299
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result v2

    const-string v5, "SeaAdjSwitch"

    if-eqz v2, :cond_174

    .line 300
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;

    invoke-virtual {v2}, Landroid/widget/RadioGroup;->getCheckedRadioButtonId()I

    move-result v2

    const v6, 0x7f0a18c4

    if-ne v2, v6, :cond_14b

    move v4, v0

    :cond_14b
    invoke-virtual {p1, v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setSeaAdjSwitch(Z)V

    .line 301
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->devId:Ljava/lang/String;

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v4

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z

    move-result v4

    invoke-interface {v1, v2, v4}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;

    .line 302
    invoke-interface {v1}, Landroid/content/SharedPreferences$Editor;->apply()V

    goto :goto_198

    .line 304
    :cond_174
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sharedPreferences:Landroid/content/SharedPreferences;

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->devId:Ljava/lang/String;

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v4

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-interface {v1, v2, v0}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z

    move-result v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setSeaAdjSwitch(Z)V

    .line 307
    :goto_198
    iget-boolean v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z

    if-eqz v1, :cond_1e5

    .line 308
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v1

    if-eqz v1, :cond_1a8

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v1

    if-ne v1, v3, :cond_1bd

    :cond_1a8
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result v1

    if-nez v1, :cond_1bd

    const p1, 0x7f141295

    .line 309
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    goto :goto_1f3

    .line 311
    :cond_1bd
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;->getStartTimeBeans()Ljava/util/List;

    move-result-object v1

    invoke-virtual {p1, v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setStartTimeList(Ljava/util/List;)V

    .line 312
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v1

    invoke-interface {v1}, Ljava/util/List;->size()I

    move-result v1

    if-nez v1, :cond_1df

    const p1, 0x7f141297

    .line 313
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1, v0}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    goto :goto_1f3

    .line 315
    :cond_1df
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->presenter:Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;

    invoke-virtual {v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V

    goto :goto_1f3

    .line 319
    :cond_1e5
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;->getStartTimeBeans()Ljava/util/List;

    move-result-object v0

    invoke-virtual {p1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setStartTimeList(Ljava/util/List;)V

    .line 320
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->presenter:Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;

    invoke-virtual {v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V

    :goto_1f3
    return-void
.end method
```

## lines 2774-3129: `.method public initDataViews(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

```smali
.method public initDataViews(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
    .registers 6

    .line 395
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result v0

    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z

    .line 396
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numberText:Landroid/widget/TextView;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v1

    invoke-static {v1}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    .line 398
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->checkZones:Ljava/util/List;

    if-nez v0, :cond_3d

    .line 399
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v0

    if-eqz v0, :cond_31

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Landroid/text/TextUtils;->isEmpty(Ljava/lang/CharSequence;)Z

    move-result v0

    if-nez v0, :cond_31

    .line 400
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/widget/EditText;->setHint(Ljava/lang/CharSequence;)V

    goto :goto_3d

    .line 402
    :cond_31
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;

    const v1, 0x7f1412c4

    invoke-virtual {p0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getString(I)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/widget/EditText;->setHint(Ljava/lang/CharSequence;)V

    .line 406
    :cond_3d
    :goto_3d
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z

    move-result v0

    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->isChecked:Z

    .line 408
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v0

    if-nez v0, :cond_5b

    .line 409
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    const v1, 0x7f0a189c

    invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V

    .line 410
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->weekAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result v1

    invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->setChecks(I)V

    goto :goto_c5

    .line 411
    :cond_5b
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v0

    const/4 v1, 0x1

    if-ne v0, v1, :cond_6b

    .line 412
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    const v1, 0x7f0a18ba

    invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V

    goto :goto_c5

    .line 413
    :cond_6b
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v0

    const/4 v2, 0x2

    if-ne v0, v2, :cond_7b

    .line 414
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    const v1, 0x7f0a18a2

    invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V

    goto :goto_c5

    .line 415
    :cond_7b
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result v0

    const/4 v3, 0x3

    if-ne v0, v3, :cond_c5

    .line 416
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->periodGroup:Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;

    const v3, 0x7f0a18a8

    invoke-virtual {v0, v3}, Lcom/inkbird/inkbirdapp/device/iic800/widget/FlowRadioGroup;->check(I)V

    .line 417
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->intervalsText:Landroid/widget/TextView;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result v3

    invoke-static {v3}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    .line 418
    new-instance v0, Ljava/util/Date;

    invoke-direct {v0}, Ljava/util/Date;-><init>()V

    .line 419
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I

    move-result v3

    add-int/lit8 v3, v3, 0x64

    invoke-virtual {v0, v3}, Ljava/util/Date;->setYear(I)V

    .line 420
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I

    move-result v3

    sub-int/2addr v3, v1

    invoke-virtual {v0, v3}, Ljava/util/Date;->setMonth(I)V

    .line 421
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/util/Date;->setDate(I)V

    .line 422
    invoke-static {}, Ljava/util/Locale;->getDefault()Ljava/util/Locale;

    move-result-object v1

    invoke-static {v2, v1}, Ljava/text/DateFormat;->getDateInstance(ILjava/util/Locale;)Ljava/text/DateFormat;

    move-result-object v1

    .line 423
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->dateText:Landroid/widget/TextView;

    invoke-virtual {v1, v0}, Ljava/text/DateFormat;->format(Ljava/util/Date;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    .line 426
    :cond_c5
    :goto_c5
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result v0

    if-eqz v0, :cond_da

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z

    move-result v0

    if-eqz v0, :cond_da

    .line 427
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;

    const v1, 0x7f0a18c4

    invoke-virtual {v0, v1}, Landroid/widget/RadioGroup;->check(I)V

    goto :goto_e2

    .line 429
    :cond_da
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->sensorGroup:Landroid/widget/RadioGroup;

    const v1, 0x7f0a18c3

    invoke-virtual {v0, v1}, Landroid/widget/RadioGroup;->check(I)V

    .line 432
    :goto_e2
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result v0

    if-nez v0, :cond_105

    .line 433
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;

    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getResources()Landroid/content/res/Resources;

    move-result-object v1

    const v2, 0x7f060b1a

    invoke-virtual {v1, v2}, Landroid/content/res/Resources;->getColor(I)I

    move-result v1

    invoke-virtual {v0, v1}, Landroid/widget/RadioButton;->setTextColor(I)V

    .line 434
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rainText:Landroid/widget/TextView;

    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->getResources()Landroid/content/res/Resources;

    move-result-object v1

    invoke-virtual {v1, v2}, Landroid/content/res/Resources;->getColor(I)I

    move-result v1

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setTextColor(I)V

    .line 437
    :cond_105
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;

    new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda8;

    invoke-direct {v1, p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda8;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V

    invoke-virtual {v0, v1}, Landroid/widget/RadioButton;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    .line 444
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rangeSeekBar:Lcom/jaygoo/widget/RangeSeekBar;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I

    move-result v1

    int-to-float v1, v1

    invoke-virtual {v0, v1}, Lcom/jaygoo/widget/RangeSeekBar;->setProgress(F)V

    .line 446
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v0

    if-eqz v0, :cond_143

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v0

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    if-lez v0, :cond_143

    .line 447
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object p1

    invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object p1

    :goto_131
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v0

    if-eqz v0, :cond_143

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    .line 448
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->startTimeAdapter:Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;

    invoke-virtual {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/SetStartTimeAdapter;->addStartTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;)Z

    goto :goto_131

    :cond_143
    return-void
.end method
```

## lines 3340-3411: `.method public setZonesNumberText()V`

```smali
.method public setZonesNumberText()V
    .registers 5

    .line 369
    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/NumberAdapter;

    invoke-direct {v0, p0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/NumberAdapter;-><init>(Landroid/content/Context;)V

    .line 370
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->zoneNumbers:Ljava/util/List;

    invoke-virtual {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/NumberAdapter;->setList(Ljava/util/Collection;)V

    .line 371
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;

    new-instance v2, Landroidx/recyclerview/widget/LinearLayoutManager;

    const/4 v3, 0x0

    invoke-direct {v2, p0, v3, v3}, Landroidx/recyclerview/widget/LinearLayoutManager;-><init>(Landroid/content/Context;IZ)V

    invoke-virtual {v1, v2}, Landroidx/recyclerview/widget/RecyclerView;->setLayoutManager(Landroidx/recyclerview/widget/RecyclerView$LayoutManager;)V

    .line 372
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v1, v0}, Landroidx/recyclerview/widget/RecyclerView;->setAdapter(Landroidx/recyclerview/widget/RecyclerView$Adapter;)V

    .line 373
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->resetText:Landroid/widget/TextView;

    const/16 v1, 0x8

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setVisibility(I)V

    .line 374
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numbersRV:Landroidx/recyclerview/widget/RecyclerView;

    invoke-virtual {v0, v3}, Landroidx/recyclerview/widget/RecyclerView;->setVisibility(I)V

    .line 375
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->copyIV:Landroid/widget/ImageView;

    invoke-virtual {v0, v3}, Landroid/widget/ImageView;->setVisibility(I)V

    .line 376
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->numberText:Landroid/widget/TextView;

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setVisibility(I)V

    .line 377
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->nameEdit:Landroid/widget/EditText;

    invoke-virtual {v0, v3}, Landroid/widget/EditText;->setEnabled(Z)V

    const/4 v0, 0x1

    .line 384
    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->finalTotalSea:Z

    .line 385
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;->rb_sea_yes:Landroid/widget/RadioButton;

    new-instance v1, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda9;

    invoke-direct {v1, p0}, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity$$ExternalSyntheticLambda9;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;)V

    invoke-virtual {v0, v1}, Landroid/widget/RadioButton;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    return-void
.end method
```

# Iic800AddPlanPresenter

## lines 57-63: `.method static bridge synthetic -$$Nest$fgetiicZoneBean(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;)Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;`

```smali
.method static bridge synthetic -$$Nest$fgetiicZoneBean(Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;)Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;
    .registers 1

    iget-object p0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    return-object p0
.end method
```

## lines 149-313: `.method private initData()V`

```smali
.method private initData()V
    .registers 5

    .line 45
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    const-string v1, "devId"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    .line 46
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    const-string v1, "iicZoneBean"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->getSerializableExtra(Ljava/lang/String;)Ljava/io/Serializable;

    move-result-object v0

    check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    .line 47
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    const-string v1, "zoneBeans"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->getSerializableExtra(Ljava/lang/String;)Ljava/io/Serializable;

    move-result-object v0

    check-cast v0, Ljava/util/List;

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->checkZones:Ljava/util/List;

    .line 48
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getPackageName()Ljava/lang/String;

    move-result-object v1

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/app/Activity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object v0

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->sharedPreferences:Landroid/content/SharedPreferences;

    .line 50
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->checkZones:Ljava/util/List;

    if-nez v1, :cond_90

    .line 51
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, "name"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    const/4 v3, 0x0

    invoke-interface {v0, v2, v3}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->setName(Ljava/lang/String;)V

    .line 52
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I

    move-result v0

    if-lez v0, :cond_78

    .line 53
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-interface {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;->initDataViews(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V

    return-void

    .line 55
    :cond_78
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v1

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isTotalSeaSwitch()Z

    move-result v2

    iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z

    move-result v3

    invoke-interface {v0, v1, v2, v3}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;->setZoneNumberText(IZZ)V

    return-void

    .line 58
    :cond_90
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;

    invoke-interface {v0}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800AddPlanView;->setZonesNumberText()V

    return-void
.end method
```

## lines 315-551: `.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;`

```smali
.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
    .registers 8

    .line 157
    new-instance v0, Ljava/lang/StringBuilder;

    const/4 v1, 0x2

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-direct {v0, p1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 158
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 p1, 0x0

    move v2, p1

    .line 159
    :goto_17
    const-string v3, "FF"

    const/4 v4, 0x6

    if-ge v2, v4, :cond_42

    .line 160
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v4

    invoke-interface {v4}, Ljava/util/List;->size()I

    move-result v4

    if-ge v2, v4, :cond_3c

    .line 161
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v3

    invoke-interface {v3, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I

    move-result v3

    invoke-static {v3, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_3f

    .line 163
    :cond_3c
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_3f
    add-int/lit8 v2, v2, 0x1

    goto :goto_17

    :cond_42
    :goto_42
    if-ge p1, v4, :cond_6a

    .line 167
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-ge p1, v2, :cond_64

    .line 168
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    invoke-interface {v2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I

    move-result v2

    invoke-static {v2, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_67

    .line 170
    :cond_64
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_67
    add-int/lit8 p1, p1, 0x1

    goto :goto_42

    .line 173
    :cond_6a
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 174
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 175
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 176
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 177
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 178
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z

    move-result p1

    const-string v1, "1"

    const-string v2, "0"

    if-eqz p1, :cond_af

    .line 179
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_b2

    .line 181
    :cond_af
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 183
    :goto_b2
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z

    move-result p1

    if-eqz p1, :cond_bc

    .line 184
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_bf

    .line 186
    :cond_bc
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 188
    :goto_bf
    const-string p1, "\u6211\u53d1\u768438"

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    .line 189
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    return-object p1
.end method
```

## lines 656-734: `.method public reset()V`

```smali
.method public reset()V
    .registers 5

    .line 68
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    if-eqz v0, :cond_3f

    invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I

    move-result v0

    if-lez v0, :cond_3f

    .line 69
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V

    .line 70
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v1

    const/4 v2, 0x1

    sub-int/2addr v1, v2

    shl-int v1, v2, v1

    const/4 v2, 0x2

    invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, "00ffffffffffffffffffffffff007f15090101"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 71
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    invoke-static {v1}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;

    move-result-object v1

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->resetCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    const-string v3, "38"

    invoke-static {v3, v0, v1, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    return-void

    .line 73
    :cond_3f
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->finish()V

    return-void
.end method
```

## lines 736-922: `.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

```smali
.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
    .registers 7

    .line 79
    :try_start_0
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->mContext:Landroid/app/Activity;

    invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_5} :catch_6

    goto :goto_a

    :catch_6
    move-exception v0

    .line 81
    invoke-virtual {v0}, Ljava/lang/Exception;->printStackTrace()V

    .line 84
    :goto_a
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->iicZoneBean:Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    const-string v1, "38"

    const/4 v2, 0x1

    if-eqz v0, :cond_67

    .line 85
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v0

    if-eqz v0, :cond_50

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v0

    const-string v3, ""

    invoke-virtual {v0, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_50

    .line 86
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->sharedPreferences:Landroid/content/SharedPreferences;

    invoke-interface {v0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object v0

    .line 87
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v4

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v3

    const-string v4, "name"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getName()Ljava/lang/String;

    move-result-object v4

    invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    .line 88
    invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->apply()V

    .line 90
    :cond_50
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v0

    sub-int/2addr v0, v2

    shl-int v0, v2, v0

    .line 91
    invoke-direct {p0, v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;

    move-result-object p1

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;

    move-result-object v0

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    invoke-static {v1, p1, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    goto :goto_9c

    .line 93
    :cond_67
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->zoneNumbers:Ljava/util/List;

    if-eqz v0, :cond_9c

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    if-eqz v0, :cond_9c

    .line 95
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->zoneNumbers:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object v0

    const/4 v3, 0x0

    :goto_78
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v4

    if-eqz v4, :cond_8d

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v4

    check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;

    .line 96
    invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/ZoneNumber;->getNum()I

    move-result v4

    sub-int/2addr v4, v2

    shl-int v4, v2, v4

    add-int/2addr v3, v4

    goto :goto_78

    .line 98
    :cond_8d
    invoke-direct {p0, v3, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;

    move-result-object p1

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->devId:Ljava/lang/String;

    invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;

    move-result-object v0

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800AddPlanPresenter;->setCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    invoke-static {v1, p1, v0, v2}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    :cond_9c
    :goto_9c
    return-void
.end method
```

# Iic800SchedulePresenter

## lines 93-320: `.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;`

```smali
.method private parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;
    .registers 8

    .line 127
    new-instance v0, Ljava/lang/StringBuilder;

    const/4 v1, 0x2

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-direct {v0, p1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 128
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRunTime()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 p1, 0x0

    move v2, p1

    .line 129
    :goto_17
    const-string v3, "FF"

    const/4 v4, 0x6

    if-ge v2, v4, :cond_42

    .line 130
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v4

    invoke-interface {v4}, Ljava/util/List;->size()I

    move-result v4

    if-ge v2, v4, :cond_3c

    .line 131
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v3

    invoke-interface {v3, v2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I

    move-result v3

    invoke-static {v3, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_3f

    .line 133
    :cond_3c
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_3f
    add-int/lit8 v2, v2, 0x1

    goto :goto_17

    :cond_42
    :goto_42
    if-ge p1, v4, :cond_6a

    .line 137
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-ge p1, v2, :cond_64

    .line 138
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v2

    invoke-interface {v2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I

    move-result v2

    invoke-static {v2, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_67

    .line 140
    :cond_64
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_67
    add-int/lit8 p1, p1, 0x1

    goto :goto_42

    .line 143
    :cond_6a
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 144
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 145
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 146
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 147
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I

    move-result p1

    invoke-static {p1, v1}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 148
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z

    move-result p1

    const-string v1, "1"

    const-string v2, "0"

    if-eqz p1, :cond_af

    .line 149
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_b2

    .line 151
    :cond_af
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 153
    :goto_b2
    invoke-virtual {p2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z

    move-result p1

    if-eqz p1, :cond_bc

    .line 154
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_bf

    .line 156
    :cond_bc
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 158
    :goto_bf
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    return-object p1
.end method
```

## lines 526-769: `.method public CutForPhoto(Landroid/net/Uri;)Landroid/content/Intent;`

```smali
.method public CutForPhoto(Landroid/net/Uri;)Landroid/content/Intent;
    .registers 10

    .line 259
    :try_start_0
    new-instance v0, Landroid/content/Intent;

    const-string v1, "com.android.camera.action.CROP"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 260
    new-instance v1, Ljava/io/File;

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v2}, Landroidx/fragment/app/Fragment;->requireContext()Landroid/content/Context;

    move-result-object v2

    const-string v3, "image"

    invoke-static {v2, v3}, Lcom/inkbird/base/utils/file/FileUtils;->getSafeFileDir(Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 261
    new-instance v2, Ljava/io/File;

    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    iget v4, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->zoneId:I

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v3

    const-string v4, ".png"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-direct {v2, v1, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 262
    invoke-virtual {v2}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_41

    .line 263
    invoke-virtual {v2}, Ljava/io/File;->delete()Z

    .line 265
    :cond_41
    invoke-virtual {v2}, Ljava/io/File;->createNewFile()Z

    .line 266
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v1

    const-string v3, "window"

    invoke-virtual {v1, v3}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Landroid/view/WindowManager;

    .line 267
    new-instance v3, Landroid/util/DisplayMetrics;

    invoke-direct {v3}, Landroid/util/DisplayMetrics;-><init>()V

    .line 268
    invoke-interface {v1}, Landroid/view/WindowManager;->getDefaultDisplay()Landroid/view/Display;

    move-result-object v1

    invoke-virtual {v1, v3}, Landroid/view/Display;->getMetrics(Landroid/util/DisplayMetrics;)V

    .line 269
    iget v1, v3, Landroid/util/DisplayMetrics;->widthPixels:I

    .line 270
    invoke-static {v2}, Landroid/net/Uri;->fromFile(Ljava/io/File;)Landroid/net/Uri;

    move-result-object v2

    .line 271
    const-string v3, "crop"

    const/4 v4, 0x1

    invoke-virtual {v0, v3, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 272
    const-string v3, "aspectX"

    iget-object v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v5}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v5

    const/high16 v6, 0x42200000    # 40.0f

    invoke-static {v5, v6}, Lcom/inkbird/base/utils/DisplayUtil;->dp2px(Landroid/content/Context;F)I

    move-result v5

    sub-int v5, v1, v5

    invoke-virtual {v0, v3, v5}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 273
    const-string v3, "aspectY"

    iget-object v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v5}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v5

    const/high16 v7, 0x42a00000    # 80.0f

    invoke-static {v5, v7}, Lcom/inkbird/base/utils/DisplayUtil;->dp2px(Landroid/content/Context;F)I

    move-result v5

    invoke-virtual {v0, v3, v5}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 275
    const-string v3, "outputX"

    iget-object v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v5}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v5

    invoke-static {v5, v6}, Lcom/inkbird/base/utils/DisplayUtil;->dp2px(Landroid/content/Context;F)I

    move-result v5

    sub-int/2addr v1, v5

    invoke-virtual {v0, v3, v1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 276
    const-string v1, "outputY"

    iget-object v3, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v3}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v3

    invoke-static {v3, v7}, Lcom/inkbird/base/utils/DisplayUtil;->dp2px(Landroid/content/Context;F)I

    move-result v3

    invoke-virtual {v0, v1, v3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 277
    const-string v1, "scale"

    invoke-virtual {v0, v1, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 278
    const-string v1, "return-data"

    const/4 v3, 0x0

    invoke-virtual {v0, v1, v3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    if-eqz p1, :cond_bf

    .line 280
    const-string v1, "image/*"

    invoke-virtual {v0, p1, v1}, Landroid/content/Intent;->setDataAndType(Landroid/net/Uri;Ljava/lang/String;)Landroid/content/Intent;

    :cond_bf
    if-eqz v2, :cond_c6

    .line 283
    const-string p1, "output"

    invoke-virtual {v0, p1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    .line 285
    :cond_c6
    const-string p1, "noFaceDetection"

    invoke-virtual {v0, p1, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 286
    const-string p1, "outputFormat"

    sget-object v1, Landroid/graphics/Bitmap$CompressFormat;->JPEG:Landroid/graphics/Bitmap$CompressFormat;

    invoke-virtual {v1}, Landroid/graphics/Bitmap$CompressFormat;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, p1, v1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    .line 288
    invoke-virtual {v0, v4}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;
    :try_end_d9
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_d9} :catch_da

    return-object v0

    :catch_da
    move-exception p1

    .line 292
    invoke-virtual {p1}, Ljava/io/IOException;->printStackTrace()V

    const/4 p1, 0x0

    return-object p1
.end method
```

## lines 771-908: `.method public deleteBg()V`

```smali
.method public deleteBg()V
    .registers 7

    .line 222
    const-string v0, ".png"

    :try_start_2
    new-instance v1, Ljava/io/File;

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v2}, Landroidx/fragment/app/Fragment;->requireContext()Landroid/content/Context;

    move-result-object v2

    const-string v3, "image"

    invoke-static {v2, v3}, Lcom/inkbird/base/utils/file/FileUtils;->getSafeFileDir(Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 223
    new-instance v2, Ljava/io/File;

    const-string v3, "Pictures"

    invoke-static {v3}, Landroid/os/Environment;->getExternalStoragePublicDirectory(Ljava/lang/String;)Ljava/io/File;

    move-result-object v3

    invoke-virtual {v3}, Ljava/io/File;->getPath()Ljava/lang/String;

    move-result-object v3

    invoke-direct {v2, v3}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 224
    new-instance v3, Ljava/io/File;

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    iget v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->zoneId:I

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-direct {v3, v1, v4}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 225
    new-instance v1, Ljava/io/File;

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    iget v5, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->zoneId:I

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {v1, v2, v0}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 226
    invoke-virtual {v3}, Ljava/io/File;->exists()Z

    move-result v0

    if-eqz v0, :cond_67

    .line 227
    invoke-virtual {v3}, Ljava/io/File;->delete()Z

    .line 229
    :cond_67
    invoke-virtual {v1}, Ljava/io/File;->exists()Z

    move-result v0

    if-eqz v0, :cond_75

    .line 230
    invoke-virtual {v1}, Ljava/io/File;->delete()Z
    :try_end_70
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_70} :catch_71

    goto :goto_75

    :catch_71
    move-exception v0

    .line 233
    invoke-virtual {v0}, Ljava/lang/Exception;->printStackTrace()V

    .line 236
    :cond_75
    :goto_75
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;

    iget v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->zoneId:I

    invoke-interface {v0, v1}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;->updateItem(I)V

    return-void
.end method
```

## lines 910-944: `.method public editPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

```smali
.method public editPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
    .registers 5

    .line 72
    new-instance v0, Landroid/content/Intent;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v1}, Landroidx/fragment/app/Fragment;->getActivity()Landroidx/fragment/app/FragmentActivity;

    move-result-object v1

    const-class v2, Lcom/inkbird/inkbirdapp/device/iic800/activity/activity/Iic800AddPlanActivity;

    invoke-direct {v0, v1, v2}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 73
    const-string v1, "devId"

    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;

    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    .line 74
    const-string v1, "iicZoneBean"

    invoke-virtual {v0, v1, p1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/io/Serializable;)Landroid/content/Intent;

    .line 75
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {p1, v0}, Landroidx/fragment/app/Fragment;->startActivity(Landroid/content/Intent;)V

    return-void
.end method
```

## lines 1023-1075: `.method public onActivityResult(IILandroid/content/Intent;)V`

```smali
.method public onActivityResult(IILandroid/content/Intent;)V
    .registers 5

    const/4 v0, -0x1

    if-ne p2, v0, :cond_26

    const/4 p2, 0x1

    if-eq p1, p2, :cond_1d

    const/16 p2, 0x13

    if-eq p1, p2, :cond_17

    const/16 p2, 0x45

    if-eq p1, p2, :cond_f

    goto :goto_26

    .line 251
    :cond_f
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mView:Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;

    iget p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->zoneId:I

    invoke-interface {p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/view/Iic800ScheduleView;->updateItem(I)V

    return-void

    .line 243
    :cond_17
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->imageUri:Landroid/net/Uri;

    invoke-direct {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->startCrop(Landroid/net/Uri;)V

    return-void

    :cond_1d
    if-eqz p3, :cond_26

    .line 247
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p1

    invoke-direct {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->startCrop(Landroid/net/Uri;)V

    :cond_26
    :goto_26
    return-void
.end method
```

## lines 1112-1243: `.method public openCamera()V`

```smali
.method public openCamera()V
    .registers 7

    .line 206
    new-instance v0, Ljava/io/File;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v1}, Landroidx/fragment/app/Fragment;->requireContext()Landroid/content/Context;

    move-result-object v1

    const-string v2, "image"

    invoke-static {v1, v2}, Lcom/inkbird/base/utils/file/FileUtils;->getSafeFileDir(Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 207
    new-instance v1, Ljava/text/SimpleDateFormat;

    const-string v2, "yyyyMMddHHmmss"

    invoke-direct {v1, v2}, Ljava/text/SimpleDateFormat;-><init>(Ljava/lang/String;)V

    .line 208
    new-instance v2, Ljava/lang/StringBuilder;

    const-string v3, "inkbird"

    invoke-direct {v2, v3}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    new-instance v3, Ljava/util/Date;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v4

    invoke-direct {v3, v4, v5}, Ljava/util/Date;-><init>(J)V

    invoke-virtual {v1, v3}, Ljava/text/SimpleDateFormat;->format(Ljava/util/Date;)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, ".png"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    .line 209
    new-instance v2, Ljava/io/File;

    invoke-direct {v2, v0, v1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 210
    invoke-virtual {v2}, Ljava/io/File;->getPath()Ljava/lang/String;

    move-result-object v0

    .line 211
    new-instance v1, Ljava/io/File;

    sget-object v3, Ljava/io/File;->separator:Ljava/lang/String;

    invoke-virtual {v0, v3}, Ljava/lang/String;->lastIndexOf(Ljava/lang/String;)I

    move-result v3

    const/4 v4, 0x0

    invoke-virtual {v0, v4, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v0

    invoke-direct {v1, v0}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 212
    invoke-virtual {v1}, Ljava/io/File;->exists()Z

    move-result v0

    if-nez v0, :cond_5c

    .line 213
    invoke-virtual {v1}, Ljava/io/File;->mkdirs()Z

    .line 214
    :cond_5c
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.media.action.IMAGE_CAPTURE"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 215
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v1

    invoke-static {v1, v2}, Lcom/inkbird/base/utils/file/FileProviderCompat;->getUriForFile(Landroid/content/Context;Ljava/io/File;)Landroid/net/Uri;

    move-result-object v1

    iput-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->imageUri:Landroid/net/Uri;

    .line 216
    const-string v2, "output"

    invoke-virtual {v0, v2, v1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    .line 217
    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    const/16 v2, 0x13

    invoke-virtual {v1, v0, v2}, Landroidx/fragment/app/Fragment;->startActivityForResult(Landroid/content/Intent;I)V

    return-void
.end method
```

## lines 1254-1295: `.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V`

```smali
.method public setPlan(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)V
    .registers 5

    .line 120
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {v0}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object v0

    invoke-static {v0}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V

    .line 122
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v0

    const/4 v1, 0x1

    sub-int/2addr v0, v1

    shl-int v0, v1, v0

    .line 123
    invoke-direct {p0, v0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->parseIICZoneBean(ILcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;)Ljava/lang/String;

    move-result-object p1

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->devId:Ljava/lang/String;

    invoke-static {v0}, Lcom/thingclips/smart/home/sdk/ThingHomeSdk;->newDeviceInstance(Ljava/lang/String;)Lcom/thingclips/smart/sdk/api/IThingDevice;

    move-result-object v0

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    const-string v2, "38"

    invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    return-void
.end method
```

## lines 1297-1547: `.method public setScheduleTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;I)V`

```smali
.method public setScheduleTime(Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;I)V
    .registers 8

    .line 163
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getZoneId()I

    move-result v1

    const/4 v2, 0x1

    sub-int/2addr v1, v2

    shl-int v1, v2, v1

    const/4 v2, 0x2

    invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    .line 164
    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 p2, 0x0

    move v1, p2

    .line 165
    :goto_1b
    const-string v3, "FF"

    const/4 v4, 0x6

    if-ge v1, v4, :cond_46

    .line 166
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v4

    invoke-interface {v4}, Ljava/util/List;->size()I

    move-result v4

    if-ge v1, v4, :cond_40

    .line 167
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v3

    invoke-interface {v3, v1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I

    move-result v3

    invoke-static {v3, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_43

    .line 169
    :cond_40
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_43
    add-int/lit8 v1, v1, 0x1

    goto :goto_1b

    :cond_46
    :goto_46
    if-ge p2, v4, :cond_6e

    .line 173
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v1

    invoke-interface {v1}, Ljava/util/List;->size()I

    move-result v1

    if-ge p2, v1, :cond_68

    .line 174
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getStartTimeList()Ljava/util/List;

    move-result-object v1

    invoke-interface {v1, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I

    move-result v1

    invoke-static {v1, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_6b

    .line 176
    :cond_68
    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    :goto_6b
    add-int/lit8 p2, p2, 0x1

    goto :goto_46

    .line 179
    :cond_6e
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleMode()I

    move-result p2

    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 180
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getScheduleDay()I

    move-result p2

    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 181
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalYear()I

    move-result p2

    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 182
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalMonth()I

    move-result p2

    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 183
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getIntervalDay()I

    move-result p2

    invoke-static {p2, v2}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 185
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isEnable()Z

    move-result p2

    const-string v1, "1"

    const-string v2, "0"

    if-eqz p2, :cond_b3

    .line 186
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_b6

    .line 188
    :cond_b3
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 191
    :goto_b6
    invoke-virtual {p1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isSeaAdjSwitch()Z

    move-result p1

    if-eqz p1, :cond_c0

    .line 192
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_c3

    .line 194
    :cond_c0
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 197
    :goto_c3
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object p1

    invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V

    .line 198
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    const-string v1, "38"

    invoke-static {v1, p1, p2, v0}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    return-void
.end method
```

## lines 1549-1656: `.method public startManuals(Ljava/util/List;)V`

```smali
.method public startManuals(Ljava/util/List;)V
    .registers 6
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/util/List<",
            "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
            ">;)V"
        }
    .end annotation

    .line 83
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;

    if-eqz v0, :cond_58

    .line 84
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    .line 85
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    .line 86
    invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object p1

    :goto_12
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_33

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    .line 87
    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I

    move-result v2

    const/4 v3, 0x4

    invoke-static {v2, v3}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 v2, 0x0

    .line 88
    invoke-static {v2, v3}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_12

    .line 91
    :cond_33
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object p1

    invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V

    .line 92
    new-instance p1, Ljava/lang/StringBuilder;

    const-string v2, "0201"

    invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    const-string v2, "45"

    invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    :cond_58
    return-void
.end method
```

## lines 1658-1799: `.method public stopManual(Ljava/util/List;)V`

```smali
.method public stopManual(Ljava/util/List;)V
    .registers 9
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/util/List<",
            "Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;",
            ">;)V"
        }
    .end annotation

    .line 97
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;

    if-eqz v0, :cond_75

    .line 98
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    .line 99
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    .line 101
    invoke-interface {p1}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object p1

    const/4 v2, 0x0

    move v3, v2

    :goto_14
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v4

    if-eqz v4, :cond_4e

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v4

    check-cast v4, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    .line 102
    invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWateringSwitch()Z

    move-result v5

    const/4 v6, 0x4

    if-eqz v5, :cond_37

    .line 104
    invoke-static {v2, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 105
    invoke-static {v2, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 v3, 0x1

    goto :goto_14

    .line 107
    :cond_37
    invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getRemainTime()I

    move-result v5

    invoke-static {v5, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v0, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 108
    invoke-virtual {v4}, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->getWateredTime()I

    move-result v4

    invoke-static {v4, v6}, Lcom/inkbird/base/utils/StringUtils;->intToHex(II)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v1, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_14

    :cond_4e
    if-eqz v3, :cond_75

    .line 113
    iget-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mContext:Landroidx/fragment/app/Fragment;

    invoke-virtual {p1}, Landroidx/fragment/app/Fragment;->getContext()Landroid/content/Context;

    move-result-object p1

    invoke-static {p1}, Lcom/thingclips/smart/uispecs/component/ProgressUtils;->showLoadingViewFullPage(Landroid/content/Context;)V

    .line 114
    new-instance p1, Ljava/lang/StringBuilder;

    const-string v2, "0201"

    invoke-direct {p1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->mDevice:Lcom/thingclips/smart/sdk/api/IThingDevice;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/presenter/Iic800SchedulePresenter;->resultCallback:Lcom/thingclips/smart/sdk/api/IResultCallback;

    const-string v2, "45"

    invoke-static {v2, p1, v0, v1}, Lcom/inkbird/base/common/wifi/DeviceUtils;->sendCommand(Ljava/lang/String;Ljava/lang/Object;Lcom/thingclips/smart/sdk/api/IThingDevice;Lcom/thingclips/smart/sdk/api/IResultCallback;)V

    :cond_75
    return-void
.end method
```

# IicZoneBean

## lines 64-82: `.method public constructor <init>(I)V`

```smali
.method public constructor <init>(I)V
    .registers 3

    .line 60
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, 0x0

    .line 44
    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateringSwitch:Z

    .line 50
    iput-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWait:Z

    .line 61
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I

    return-void
.end method
```

## lines 86-120: `.method public equals(Ljava/lang/Object;)Z`

```smali
.method public equals(Ljava/lang/Object;)Z
    .registers 3

    .line 234
    instance-of v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    if-eqz v0, :cond_10

    .line 235
    check-cast p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;

    .line 236
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I

    iget p1, p1, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I

    if-ne v0, p1, :cond_e

    const/4 p1, 0x1

    return p1

    :cond_e
    const/4 p1, 0x0

    return p1

    .line 238
    :cond_10
    invoke-super {p0, p1}, Ljava/lang/Object;->equals(Ljava/lang/Object;)Z

    move-result p1

    return p1
.end method
```

## lines 122-129: `.method public getAdjustValue()I`

```smali
.method public getAdjustValue()I
    .registers 2

    .line 153
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->adjustValue:I

    return v0
.end method
```

## lines 131-138: `.method public getIntervalDay()I`

```smali
.method public getIntervalDay()I
    .registers 2

    .line 129
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalDay:I

    return v0
.end method
```

## lines 140-147: `.method public getIntervalMonth()I`

```smali
.method public getIntervalMonth()I
    .registers 2

    .line 121
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalMonth:I

    return v0
.end method
```

## lines 149-156: `.method public getIntervalYear()I`

```smali
.method public getIntervalYear()I
    .registers 2

    .line 113
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalYear:I

    return v0
.end method
```

## lines 158-165: `.method public getManualMode()I`

```smali
.method public getManualMode()I
    .registers 2

    .line 201
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualMode:I

    return v0
.end method
```

## lines 167-174: `.method public getManualTime()I`

```smali
.method public getManualTime()I
    .registers 2

    .line 209
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualTime:I

    return v0
.end method
```

## lines 176-183: `.method public getName()Ljava/lang/String;`

```smali
.method public getName()Ljava/lang/String;
    .registers 2

    .line 73
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->name:Ljava/lang/String;

    return-object v0
.end method
```

## lines 185-192: `.method public getNextTime()J`

```smali
.method public getNextTime()J
    .registers 3

    .line 145
    iget-wide v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->nextTime:J

    return-wide v0
.end method
```

## lines 194-201: `.method public getRemainTime()I`

```smali
.method public getRemainTime()I
    .registers 2

    .line 185
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->remainTime:I

    return v0
.end method
```

## lines 203-210: `.method public getRunTime()I`

```smali
.method public getRunTime()I
    .registers 2

    .line 81
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->runTime:I

    return v0
.end method
```

## lines 212-219: `.method public getScheduleDay()I`

```smali
.method public getScheduleDay()I
    .registers 2

    .line 105
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleDay:I

    return v0
.end method
```

## lines 221-228: `.method public getScheduleMode()I`

```smali
.method public getScheduleMode()I
    .registers 2

    .line 97
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleMode:I

    return v0
.end method
```

## lines 230-245: `.method public getStartTimeList()Ljava/util/List;`

```smali
.method public getStartTimeList()Ljava/util/List;
    .registers 2
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/util/List<",
            "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
            ">;"
        }
    .end annotation

    .line 89
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->startTimeList:Ljava/util/List;

    return-object v0
.end method
```

## lines 247-254: `.method public getWateredTime()I`

```smali
.method public getWateredTime()I
    .registers 2

    .line 193
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateredTime:I

    return v0
.end method
```

## lines 256-263: `.method public getWorkMode()Ljava/lang/String;`

```smali
.method public getWorkMode()Ljava/lang/String;
    .registers 2

    .line 177
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->workMode:Ljava/lang/String;

    return-object v0
.end method
```

## lines 265-272: `.method public getZoneId()I`

```smali
.method public getZoneId()I
    .registers 2

    .line 65
    iget v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I

    return v0
.end method
```

## lines 274-281: `.method public isAlarm()Z`

```smali
.method public isAlarm()Z
    .registers 2

    .line 53
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->alarm:Z

    return v0
.end method
```

## lines 283-290: `.method public isEnable()Z`

```smali
.method public isEnable()Z
    .registers 2

    .line 217
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->enable:Z

    return v0
.end method
```

## lines 292-299: `.method public isSeaAdjSwitch()Z`

```smali
.method public isSeaAdjSwitch()Z
    .registers 2

    .line 137
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->seaAdjSwitch:Z

    return v0
.end method
```

## lines 301-308: `.method public isTotalSeaSwitch()Z`

```smali
.method public isTotalSeaSwitch()Z
    .registers 2

    .line 161
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->totalSeaSwitch:Z

    return v0
.end method
```

## lines 310-317: `.method public isWait()Z`

```smali
.method public isWait()Z
    .registers 2

    .line 225
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWait:Z

    return v0
.end method
```

## lines 319-326: `.method public isWateringSwitch()Z`

```smali
.method public isWateringSwitch()Z
    .registers 2

    .line 169
    iget-boolean v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateringSwitch:Z

    return v0
.end method
```

## lines 328-335: `.method public setAdjustValue(I)V`

```smali
.method public setAdjustValue(I)V
    .registers 2

    .line 157
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->adjustValue:I

    return-void
.end method
```

## lines 337-344: `.method public setAlarm(Z)V`

```smali
.method public setAlarm(Z)V
    .registers 2

    .line 57
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->alarm:Z

    return-void
.end method
```

## lines 346-353: `.method public setEnable(Z)V`

```smali
.method public setEnable(Z)V
    .registers 2

    .line 221
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->enable:Z

    return-void
.end method
```

## lines 355-362: `.method public setIntervalDay(I)V`

```smali
.method public setIntervalDay(I)V
    .registers 2

    .line 133
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalDay:I

    return-void
.end method
```

## lines 364-371: `.method public setIntervalMonth(I)V`

```smali
.method public setIntervalMonth(I)V
    .registers 2

    .line 125
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalMonth:I

    return-void
.end method
```

## lines 373-380: `.method public setIntervalYear(I)V`

```smali
.method public setIntervalYear(I)V
    .registers 2

    .line 117
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->intervalYear:I

    return-void
.end method
```

## lines 382-389: `.method public setManualMode(I)V`

```smali
.method public setManualMode(I)V
    .registers 2

    .line 205
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualMode:I

    return-void
.end method
```

## lines 391-398: `.method public setManualTime(I)V`

```smali
.method public setManualTime(I)V
    .registers 2

    .line 213
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->manualTime:I

    return-void
.end method
```

## lines 400-407: `.method public setName(Ljava/lang/String;)V`

```smali
.method public setName(Ljava/lang/String;)V
    .registers 2

    .line 77
    iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->name:Ljava/lang/String;

    return-void
.end method
```

## lines 409-416: `.method public setNextTime(J)V`

```smali
.method public setNextTime(J)V
    .registers 3

    .line 149
    iput-wide p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->nextTime:J

    return-void
.end method
```

## lines 418-425: `.method public setRemainTime(I)V`

```smali
.method public setRemainTime(I)V
    .registers 2

    .line 189
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->remainTime:I

    return-void
.end method
```

## lines 427-434: `.method public setRunTime(I)V`

```smali
.method public setRunTime(I)V
    .registers 2

    .line 85
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->runTime:I

    return-void
.end method
```

## lines 436-443: `.method public setScheduleDay(I)V`

```smali
.method public setScheduleDay(I)V
    .registers 2

    .line 109
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleDay:I

    return-void
.end method
```

## lines 445-452: `.method public setScheduleMode(I)V`

```smali
.method public setScheduleMode(I)V
    .registers 2

    .line 101
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->scheduleMode:I

    return-void
.end method
```

## lines 454-461: `.method public setSeaAdjSwitch(Z)V`

```smali
.method public setSeaAdjSwitch(Z)V
    .registers 2

    .line 141
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->seaAdjSwitch:Z

    return-void
.end method
```

## lines 463-478: `.method public setStartTimeList(Ljava/util/List;)V`

```smali
.method public setStartTimeList(Ljava/util/List;)V
    .registers 2
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/util/List<",
            "Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;",
            ">;)V"
        }
    .end annotation

    .line 93
    iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->startTimeList:Ljava/util/List;

    return-void
.end method
```

## lines 480-487: `.method public setTotalSeaSwitch(Z)V`

```smali
.method public setTotalSeaSwitch(Z)V
    .registers 2

    .line 165
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->totalSeaSwitch:Z

    return-void
.end method
```

## lines 489-496: `.method public setWait(Z)V`

```smali
.method public setWait(Z)V
    .registers 2

    .line 229
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->isWait:Z

    return-void
.end method
```

## lines 498-505: `.method public setWateredTime(I)V`

```smali
.method public setWateredTime(I)V
    .registers 2

    .line 197
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateredTime:I

    return-void
.end method
```

## lines 507-514: `.method public setWateringSwitch(Z)V`

```smali
.method public setWateringSwitch(Z)V
    .registers 2

    .line 173
    iput-boolean p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->wateringSwitch:Z

    return-void
.end method
```

## lines 516-523: `.method public setWorkMode(Ljava/lang/String;)V`

```smali
.method public setWorkMode(Ljava/lang/String;)V
    .registers 2

    .line 181
    iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->workMode:Ljava/lang/String;

    return-void
.end method
```

## lines 525-532: `.method public setZoneId(I)V`

```smali
.method public setZoneId(I)V
    .registers 2

    .line 69
    iput p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/bean/IicZoneBean;->zoneId:I

    return-void
.end method
```
