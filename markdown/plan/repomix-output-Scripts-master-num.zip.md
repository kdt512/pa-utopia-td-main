This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: **/*.cs
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
ButtonHintNumber.cs/
  ButtonHintNumber.cs
ButtonPlusNumber.cs/
  ButtonPlusNumber.cs
ButtonPlusNumberHowToPlay.cs/
  ButtonPlusNumberHowToPlay.cs
CellNumberController.cs/
  CellNumberController.cs
Effect/
  ComboVfxAttachCellController.cs/
    ComboVfxAttachCellController.cs
  ComboVfxClearCellController.cs/
    ComboVfxClearCellController.cs
  ComboVfxDeleteRowController.cs/
    ComboVfxDeleteRowController.cs
HowToPlayCompleteModal.cs/
  HowToPlayCompleteModal.cs
HowToPlayModal.cs/
  HowToPlayModal.cs
HowToPlaySkipModal.cs/
  HowToPlaySkipModal.cs
IngameChallengeCompleteModal.cs/
  IngameChallengeCompleteModal.cs
IngameChallengeEndModal.cs/
  IngameChallengeEndModal.cs
IngameInform.cs/
  IngameInform.cs
IngameSettingModal.cs/
  IngameSettingModal.cs
IngameStageCompleteModal.cs/
  IngameStageCompleteModal.cs
IngameStageEndModal.cs/
  IngameStageEndModal.cs
InGameStageFinishCommon.cs/
  InGameStageFinishCommon.cs
NumberMatchGamePlayLogic.cs/
  NumberMatchGamePlayLogic.cs
RoundManager.cs/
  RoundManager.cs
StageUIInfo.cs/
  StageUIInfo.cs
TableNumberController.cs/
  TableNumberController.cs
```

# Files

## File: ButtonHintNumber.cs/ButtonHintNumber.cs
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ButtonHintNumber : ButtonRewardAds
{
    [SerializeField] protected Button button;
    [SerializeField] protected TableNumberController table;
    [SerializeField] TextMeshProUGUI amountText;
    [SerializeField] GameObject adLabel;
    [SerializeField] private HandTouch handTouch;
    [SerializeField] private int timeSuggestHint = 20;
    [SerializeField] private int stageSuggestHint = 2;

    private int timeCountSuggestHint;

    private void Start()
    {
        Messenger.Default.Subscribe<ButtonPlusClickPayload>(OnButtonPlusClick);
        Messenger.Default.Subscribe<BeforeClearCellPayload>(OnBeforeClearCell);
        button.onClick.AddListener(OnButtonClick);
        timeCountSuggestHint = timeSuggestHint;
        LoopSetUpHint();
    }

    private void OnDestroy()
    {
        Messenger.Default.Unsubscribe<ButtonPlusClickPayload>(OnButtonPlusClick);
        Messenger.Default.Unsubscribe<BeforeClearCellPayload>(OnBeforeClearCell);
    }

    private async void LoopSetUpHint()
    {
        while (gameObject.activeInHierarchy)
        {
            SetUpHint();
            await UniTask.WaitForSeconds(1);
            timeCountSuggestHint--;
            if (_numberMatchHomeDataAsset.NumberMatchEnd < stageSuggestHint && !handTouch.IsPlaying &&
                timeCountSuggestHint <= 0)
            {
                handTouch?.Play();
            }
        }
    }

    private void SetUpHint()
    {
        if (_numberMatchHomeDataAsset.NumHint > 0)
        {
            amountText.text = _numberMatchHomeDataAsset.NumHint.ToString();
            adLabel.SetActive(false);
        }
        else
        {
            SetupAds();
        }
    }

    private void SetupAds()
    {
        if (CanShowAds())
        {
            amountText.text = $"+{_numberMatchHomeDataAsset.NumHintReward}";
            adLabel.SetActive(true);
        }
        else
        {
            amountText.text = "0";
            adLabel.SetActive(false);
        }
    }

    private async void OnButtonClick()
    {
        ReleaseHandTouch();
        if (_numberMatchHomeDataAsset.NumHint > 0)
        {
            bool result = await table.HintCell(null);
            if (result)
            {
                _numberMatchHomeDataAsset.NumHint--;
                SetUpHint();
            }
        }
        else
        {
            if (CanShowAds())
            {
                ShowAds(OnAdsClose);
            }
        }
    }

    private void OnAdsClose()
    {
        _numberMatchHomeDataAsset.NumHint += _numberMatchHomeDataAsset.NumHintReward;
        SetUpHint();
    }

    protected override string GetScreenName()
    {
        return ScreenName.ButtonHint;
    }

    protected override ScenePlaceAds SceneType()
    {
        return ScenePlaceAds.InGame;
    }
    
    
    private void OnBeforeClearCell(BeforeClearCellPayload payload)
    {
        ReleaseHandTouch();
    }

    private void OnButtonPlusClick(ButtonPlusClickPayload payload)
    {
        ReleaseHandTouch();
    }
    
    private void ReleaseHandTouch()
    {
        handTouch?.Stop();
        timeCountSuggestHint = timeSuggestHint;
    }
}
```

## File: ButtonPlusNumber.cs/ButtonPlusNumber.cs
```csharp
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ButtonPlusNumber : ButtonInterstitialAds
{
    [SerializeField] protected RoundDataAsset asset;
    [SerializeField] protected TableNumberController table;
    [SerializeField] TextMeshProUGUI amountText;
    [SerializeField] private HandTouch _handTouch;

    protected override bool CanShowAds()
    {
        return asset.CurrentData.plus > 0 && base.CanShowAds();
    }

    private void Start()
    {
        RegisterOnAdCloseListener(OnButtonClick);
        Messenger.Default.Subscribe<StageStartPayload>(OnStageStartPayload);
        Messenger.Default.Subscribe<ButtonPlusSayPayload>(OnButtonPlusSayPayload);
    }

    private void OnStageStartPayload(StageStartPayload payload)
    {
        amountText.text = asset.CurrentData.plus.ToString();
        //amountText.transform.parent.gameObject.SetActive(asset.CurrentData.plus > 0);
        amountText.transform.parent.gameObject.SetActive(true);
    }

    private void OnDestroy()
    {
        Messenger.Default.Unsubscribe<StageStartPayload>(OnStageStartPayload);
        Messenger.Default.Unsubscribe<ButtonPlusSayPayload>(OnButtonPlusSayPayload);
    }

    private async void OnButtonClick()
    {
        UsePlus();
        _handTouch.Stop();
    }

    private async void UsePlus()
    {
        if (asset.CurrentData.plus > 0)
        {
            var result = await table.AddPlusNumber();
            if (result)
            {
                asset.UsePlus();
                amountText.text = asset.CurrentData.plus.ToString();
                Messenger.Default.Publish(new ButtonPlusClickPayload(){data = asset.CurrentData});
            }
        }
    }
    
    private void OnButtonPlusSayPayload(ButtonPlusSayPayload obj)
    {
        _handTouch?.gameObject.SetActive(true);
        _handTouch?.Play();
    }
}
```

## File: ButtonPlusNumberHowToPlay.cs/ButtonPlusNumberHowToPlay.cs
```csharp
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ButtonPlusNumberHowToPlay : MonoBehaviour
{
    [SerializeField] private Button button;
    [SerializeField] private TableNumberController table;
    [SerializeField] private HandTouch _handTouch;

    private void Start()
    {
        button.onClick.AddListener(OnButtonClick);
    }

    private void OnEnable()
    {
        _handTouch.Play();
    }
    
    private async void OnButtonClick()
    {
        gameObject.SetActive(false);
        _handTouch.Stop();
        await table.AddPlusNumber();
        Messenger.Default.Publish<ButtonPlusClickPayload>(new ButtonPlusClickPayload());
    }
}
```

## File: CellNumberController.cs/CellNumberController.cs
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class CellNumberController : MonoBehaviour
{
    private const float ALPHA_CLEAR= 0.2f;
    [SerializeField] private Button _cellButton;
    [SerializeField] private GameObject _selectedBg;
    [SerializeField] private GameObject _hintBg;
    [SerializeField] private GameObject _maskBg;
    [SerializeField] private Image _unSelectedBg;
    [SerializeField] private RectTransform _cellRect;
    [SerializeField] private TextMeshProUGUI _numberText;
    [SerializeField] private CanvasGroup _numberCanvasGroup;

    private int _cellNumber;
    private int _rowIndex;
    private int _columnIndex;
    private bool _isSelected;
    //private bool _isActive;
    private int[] _cellLinks;
    private Sequence _shakeSequence;

    private Action<CellNumberController> _onClickCallback; // 💡 callback

    public bool IsActive => CellNumber > 0;
    public bool IsCleared => CellNumber < 0;
    public bool IsEmpty => CellNumber == 0;
    public int CellNumber => _cellNumber;
    public bool IsSelected  => _isSelected;
    public int RowIndex => _rowIndex;
    public int ColumnIndex => _columnIndex;
    private Color orginColorText;

    private void Awake()
    {
        orginColorText = _numberText.color;
    }

    public void SetCallBack(Action<CellNumberController> callback)
    {
        _onClickCallback = callback;
    }

    public void SetUpNew(int rowIndex, int columnIndex, float size, Vector3 pos)
    {
        _cellRect.sizeDelta = new Vector2(size, size);
        transform.position = pos;
        
        SetSelected(false);
        _rowIndex = rowIndex;
        _columnIndex = columnIndex;
        _cellLinks = new int[8];
        
        //_hintBg.gameObject.SetActive(false);
        SetCellNumber(0);

        // Đảm bảo xoá listener cũ trước khi thêm mới
        _cellButton.onClick.RemoveAllListeners();
        _cellButton.onClick.AddListener(OnCellClicked);
    }

    public void ResetIndexAndPos(int rowIndex, int columnIndex, Vector3 pos)
    {
        _rowIndex = rowIndex;
        _columnIndex = columnIndex;
        transform.position = pos;
        transform.name = $"Cell ({rowIndex}, {columnIndex})";
    }

    public void SetHint(bool isHint)
    {
        _hintBg.SetActive(isHint);
    }

    public async UniTask PlayEffectHint(float duration = 0.3f)
    {
        if (_hintBg == null) return;

        _hintBg.transform.localScale = Vector3.zero;
        
        await _hintBg.transform.DOScale(Vector3.one, duration)
            .SetEase(Ease.OutBack)
            .ToUniTask();
    }

    public void SetSelected(bool isSelected)
    {
        _isSelected = isSelected;
        _selectedBg.SetActive(_isSelected);
        _unSelectedBg.gameObject.SetActive(!_isSelected);
    }

    public void SetCellNumber(int cellNumber)
    {
        _cellNumber = cellNumber;
        _numberCanvasGroup.alpha = IsEmpty ? 0 : 1;
        _numberText.text = Mathf.Abs(cellNumber).ToString();
        SetClear(_cellNumber < 0);
    }

    public void SetColorText(Color color)
    {
        color.a = _numberText.color.a;
        _numberText.color = color;
    }

    public void SetOriginColorText()
    {
        SetColorText(orginColorText);
    }

    private void SetClear(bool isClear)
    {
        var color = _numberText.color;
        color.a = isClear? ALPHA_CLEAR : 1;
        _numberText.color = color;
    }

    public int GetCellLink(int direction)
    {
        return _cellLinks[direction];
    }

    public void SetCellLink(int direction, int cellLink)
    {
        _cellLinks[direction] = cellLink;
    }

    // ✅ Gọi khi nhấn nút
    private void OnCellClicked()
    {
        _onClickCallback?.Invoke(this);
    }

    public void SetMask(bool isMask)
    {
        _maskBg.SetActive(isMask);
    }
    
    /*
    public void ShakeOnce()
    {
        RectTransform rect = _numberText.rectTransform;

        // Reset vị trí nếu tween đang chạy
        if (_shakeTween != null && _shakeTween.IsActive())
            _shakeTween.Kill();

        rect.anchoredPosition = Vector2.zero;

        _shakeTween = rect.DOShakeAnchorPos(
            duration: 0.3f,
            strength: new Vector2(10f, 0f),
            vibrato: 10,
            randomness: 90f,
            snapping: false,
            fadeOut: true
        );
    }
    */
    public void ShakeOnce()
    {
        if (_shakeSequence != null && _shakeSequence.IsActive())
        {
            _shakeSequence.Kill();
            _numberText.rectTransform.anchoredPosition = Vector2.zero;
        }

        RectTransform rect = _numberText.rectTransform;

        _shakeSequence = DOTween.Sequence();

        // Các bước lắc cố định theo quỹ đạo
        float strength = 10f;
        float duration = 0.05f;

        _shakeSequence.Append(rect.DOAnchorPosX(+strength, duration));
        _shakeSequence.Append(rect.DOAnchorPosX(-strength, duration));
        _shakeSequence.Append(rect.DOAnchorPosX(+strength * 0.5f, duration));
        _shakeSequence.Append(rect.DOAnchorPosX(-strength * 0.5f, duration));
        _shakeSequence.Append(rect.DOAnchorPosX(0f, duration)); // về giữa
    }
}
```

## File: Effect/ComboVfxAttachCellController.cs/ComboVfxAttachCellController.cs
```csharp
using System.Collections;
using System.Collections.Generic;
using System.Threading;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using UnityEngine;

public class ComboVfxAttachCellController : MonoBehaviour
{
    [SerializeField] private UILineEffectController _lineEffectController1;
    [SerializeField] private UILineEffectController _lineEffectController2;
    [SerializeField] private UILineEffectController _lineEffectController3;
    [SerializeField] private Transform _p1;
    [SerializeField] private Transform _p2;
    [SerializeField] private Transform _p3;
    [SerializeField] private Transform _p4;
    [SerializeField] private float _durationGrow = 0.7f;
    private CancellationTokenSource _cts;
    
    public void SetUpAndPlay2(Vector3 pos1, Vector3 pos2, Vector3 pos3, Vector3 pos4)
    {
        _p1.position = pos1;
        _p2.position = pos2;
        _p3.position = pos3;
        _p4.position = pos4;
        
        _cts = new CancellationTokenSource();
        PlayLoop2(_cts.Token).Forget();
    }
    
    private async UniTaskVoid PlayLoop2(CancellationToken cancellationToken)
    {
        var distance1 = Vector3.Distance(_p1.position, _p2.position);
        var distance2 = Vector3.Distance(_p3.position, _p4.position);
        var distance = distance1 + distance2;
            
        var duration1 = _durationGrow * distance1 / distance;
        var duration2 = _durationGrow * distance2 / distance;
        
        while (!cancellationToken.IsCancellationRequested)
        {
            _lineEffectController1.SetDuration(duration1);
            _lineEffectController1.gameObject.SetActive(true);
            await UniTask.WaitForSeconds(duration1, cancellationToken: cancellationToken);
            
            _lineEffectController2.SetDuration(duration2);
            _lineEffectController2.gameObject.SetActive(true);
            await UniTask.WaitForSeconds(duration2, cancellationToken: cancellationToken);
            
            _lineEffectController1.gameObject.SetActive(false);
            _lineEffectController2.gameObject.SetActive(false);
            
        }
    }
    
    public void SetUpAndPlay1(Vector3 pos1, Vector3 pos2)
    {
        _p1.position = pos1;
        _p2.position = pos2;
        
        _cts = new CancellationTokenSource();
        PlayLoop1(_cts.Token).Forget();
        
    }


    private async UniTaskVoid PlayLoop1(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            _lineEffectController3.SetDuration(_durationGrow);
            _lineEffectController3.gameObject.SetActive(true);
            await UniTask.WaitForSeconds(_durationGrow, cancellationToken: cancellationToken);
            _lineEffectController3.gameObject.SetActive(false);
        }
    }

    public void Stop()
    {
        if (_cts != null)
        {
            _cts.Cancel();
            _cts.Dispose();
            _cts = null;
            
        }
        _lineEffectController1.gameObject.SetActive(false);
        _lineEffectController2.gameObject.SetActive(false);
        _lineEffectController3.gameObject.SetActive(false);
        gameObject.SetActive(false);
    }
}
```

## File: Effect/ComboVfxClearCellController.cs/ComboVfxClearCellController.cs
```csharp
using System.Collections;
using System.Collections.Generic;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using UnityEngine;

public class ComboVfxClearCellController : MonoBehaviour
{
    [SerializeField] private UILineEffectController _lineEffectController1;
    [SerializeField] private UILineEffectController _lineEffectController2;
    [SerializeField] private UILineEffectController _lineEffectController3;
    [SerializeField] private UIParticle _particle1;
    [SerializeField] private UIParticle _particle2;
    [SerializeField] private Transform _p3;
    [SerializeField] private Transform _p4;
    [SerializeField] private float duration = 0.6f;

    private bool isShowTwoLine;

    public void SetUp(Vector3 pos1, Vector3 pos2, float scale)
    {
        _particle1.transform.position = pos1;
        _particle2.transform.position = pos2;
        _p3.transform.position = pos2;
        _particle1.scale = scale;
        _particle2.scale = scale;
        isShowTwoLine = false;
    }
    
    public void SetUp2(Vector3 pos1, Vector3 pos2, Vector3 pos3, Vector3 pos4, float scale)
    {
        _particle1.transform.position = pos1;
        _particle2.transform.position = pos2;
        _particle1.scale = scale;
        _particle2.scale = scale;
        _p3.transform.position = pos3;
        _p4.transform.position = pos4;
        isShowTwoLine = true;
    }
    

    public async UniTask Play()
    {
        _particle1.Play();
        _particle2.Play();
        
        if (isShowTwoLine)
        {
            _lineEffectController1.gameObject.SetActive(true);
            _lineEffectController2.gameObject.SetActive(true);
        }
        else
        {
            _lineEffectController3.gameObject.SetActive(true);
        }
        await UniTask.WaitForSeconds(duration);
        Clear();
    }

    public async UniTask Clear()
    {
        await UniTask.Delay(1000);
        //Destroy(gameObject);
        GameObjectPool.Instance.Return(gameObject);
    }
}
```

## File: Effect/ComboVfxDeleteRowController.cs/ComboVfxDeleteRowController.cs
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using DG.Tweening;
using UnityEngine;

public class ComboVfxDeleteRowController : MonoBehaviour
{
    [SerializeField] private UIParticle _vfxDeleteRow;
    [SerializeField] private UIParticle _vfxDeleteCellPrefab;
    [SerializeField] private float _timeMoveOneCell = 0.1f;
    
    private List<UIParticle> _vfxDeleteCells = new List<UIParticle>();
    private Vector3 _firstCellPos;
    private int _numCell;
    private float _cellSize;
    
    
    public void SetUp(Vector3 firstCellPos, int numCell, float cellSize)
    {
        _firstCellPos = firstCellPos;
        _numCell = numCell;
        _cellSize = cellSize;

        _vfxDeleteCells.Clear();
        for (int i = 0; i < _numCell; i++)
        {
            _vfxDeleteCells.Add(Instantiate(_vfxDeleteCellPrefab,transform));
            _vfxDeleteCells[i].transform.position = _firstCellPos + new Vector3(i * _cellSize, 0, 0);
            _vfxDeleteCells[i].scale = _cellSize;
            _vfxDeleteCells[i].gameObject.SetActive(false);
        }
    }

    public async UniTask Play()
    {
        Vector3 startPos = _firstCellPos - new Vector3(_cellSize, 0, 0);
        Vector3 endPos = _firstCellPos + new Vector3(_cellSize, 0, 0) *_numCell;
        _vfxDeleteRow.gameObject.SetActive(true);
        _vfxDeleteRow.transform.position = startPos;
        _vfxDeleteRow.transform.DOMove(endPos, _timeMoveOneCell * (_numCell + 1)).SetEase(Ease.Linear);
        
        float callStartTime = _timeMoveOneCell * 2;
        await UniTask.Delay(TimeSpan.FromSeconds(callStartTime));
        for (int i = 0; i < _numCell; i++)
        {
            _vfxDeleteCells[i].gameObject.SetActive(true);
            _vfxDeleteCells[i].Stop();
            _vfxDeleteCells[i].Play();
            await UniTask.Delay(TimeSpan.FromSeconds(_timeMoveOneCell));
        }
        await UniTask.Delay(TimeSpan.FromSeconds(0.6f));
        AfterPlay();
    }

    private async UniTask AfterPlay()
    {
        await UniTask.Delay(1000);
        //Destroy(gameObject);
        GameObjectPool.Instance.Return(gameObject);
    }
}
```

## File: HowToPlayCompleteModal.cs/HowToPlayCompleteModal.cs
```csharp
using System;
using System.Globalization;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using GameFeatures.Common;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityScreenNavigator.Runtime.Core.Modal;
using UnityScreenNavigator.Runtime.Core.Shared;

public class HowToPlayCompleteModal : Modal
{
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] private Button _btnContinue;
    [SerializeField] private Button _btnRestart;
    [SerializeField] UIParticle _effect;
    private UnityAction _onRestartCallback;

    private void Awake()
    {
        _btnContinue.onClick.AddListener(OnContinueClicked);
        _btnRestart.onClick.AddListener(OnRestartClicked);
        _btnRestart.gameObject.SetActive(_homeDataAsset.IsFirstTutorialCompleted);
    }
    
    public override UniTask Initialize()
    {
        base.Initialize();
        _effect.Play();
        return UniTask.CompletedTask;
    }

    private void OnHomeClicked()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload());
    }
    
    private void OnRestartClicked()
    {
        _homeDataAsset.IsFirstTutorialCompleted = true;
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER_NO_DROP);
        var option = new WindowOption("PU_HowToPlay", true);
        container.Push(option);
        ClosePopup();
    }
    
    private async void OnContinueClicked()
    {
        if (!_homeDataAsset.IsFirstTutorialCompleted)
        {
            _homeDataAsset.IsFirstTutorialCompleted = true;
            await _roundDataAsset.Init(false, DateTime.Today);
            _roundDataAsset.GenNewEmptyRound(Mathf.Max(_roundDataAsset.CurrentData.bestScore,
                _roundDataAsset.CurrentData.currentScore));
            LoadingScene.Instance.LoadingHomeToGame();
        }
        else
        {
            _homeDataAsset.IsFirstTutorialCompleted = true;
            ClosePopup();
        }
        
    }

    protected void ClosePopup()
    {
        var mainScreenContainer = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER_NO_DROP_2);
        if(mainScreenContainer)
            mainScreenContainer.Pop(true);
    }
}
```

## File: HowToPlayModal.cs/HowToPlayModal.cs
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using BrunoMikoski.AnimationSequencer;
using Cysharp.Threading.Tasks;
using GameFeatures.Common;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityScreenNavigator.Runtime.Core.Modal;
using UnityScreenNavigator.Runtime.Core.Shared;

public class HowToPlayModal : Modal
{
    [SerializeField] private TutorialNumberDataAsset _tutorialNumberDataAsset;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] NumberMatchHomeDataAsset _dataHomeAsset;
    [SerializeField] TableNumberController _tableNumberController;
    
    [SerializeField] Button _skipButton;
    [SerializeField] Button _plusButton;
    [SerializeField] GameObject _plusButtonIcon;

    [SerializeField] private TextMeshProUGUI _stepTitleText;
    [SerializeField] private TextMeshProUGUI _stepDescText;
    [SerializeField] private TextMeshProUGUI _stepNumText;

    [SerializeField] private AnimationSequencerController _contentAnimation;
    [SerializeField] private HandTouch _handTouch;

    [SerializeField] private GameObject _practice;
    
    [SerializeField] private ComboVfxAttachCellController _vfxAttachCell;
    
    private int _curStepIndex;
    private int _curActionIndex;
    private TutorialNumberStep _curStep;
    private TutorialCellReleaseAction _curAction;
    private List<CellNumberController> _curCellAction;
    private bool _isCurStepEnd;
    private bool _isCurActionEnd;
    private bool _isReleaseAll;
    public override async UniTask Initialize()
    {
        _skipButton.onClick.AddListener(OnSkipButtonClicked);
        _skipButton.gameObject.SetActive(_dataHomeAsset.IsFirstTutorialCompleted);
        _curStepIndex = 0;
        Messenger.Default.Subscribe<ButtonPlusClickPayload>(OnPlusButtonClicked);
        Messenger.Default.Subscribe<BeforeClearCellPayload>(OnBeforeClearCell);
        Messenger.Default.Subscribe<AfterClearCellPayload>(OnAfterClearCell);
        await InitTable();
        DoTutorial();
    }
    
    public override void DidPushEnter()
    {
        base.DidPushEnter();
        _roundDataAsset.Init(false, DateTime.Today, true);
    }

    void OnDestroy()
    {
        Messenger.Default.Unsubscribe<ButtonPlusClickPayload>(OnPlusButtonClicked);
        Messenger.Default.Unsubscribe<BeforeClearCellPayload>(OnBeforeClearCell);
        Messenger.Default.Unsubscribe<AfterClearCellPayload>(OnAfterClearCell);
    }

    public async UniTask DoTutorial()
    {
        for (_curStepIndex = 0; _curStepIndex < _tutorialNumberDataAsset.Steps.Count; _curStepIndex++)
        {
            await StartStep();
        }
        
        ShowPopupHowToPlayComplete();
    }
    
    private async UniTask InitTable()
    {
        await UniTask.DelayFrame(1);
        _tableNumberController.SetTutorial(true);
        await _roundDataAsset.Init(false, DateTime.Today, true);
        _roundDataAsset.GenNewEmptyRound(_roundDataAsset.CurrentData.bestScore);
        _roundDataAsset.SetNumbers(_tutorialNumberDataAsset.Numbers);
        await _tableNumberController.SetUpNewTable(_tutorialNumberDataAsset.Numbers);
        await _tableNumberController.AfterLoading(_tutorialNumberDataAsset.Numbers);
    }
    
    

    private async UniTask StartStep()
    {
        _isCurStepEnd = false;
        _curStep = _tutorialNumberDataAsset.Steps[_curStepIndex];
        if (_curStepIndex > 0)
        {
            if (_contentAnimation.IsPlaying)
            {
                _contentAnimation.SetProgress(1f);
            }
            _contentAnimation.Play();
        }
        else
        {
            SetContentStep();
        }

        _plusButton.gameObject.SetActive(_curStep.isShowPlusButton);
        
        /*
        foreach (var index in _curStep.cellsReleaseBeforeAction)
        {
            _tableNumberController.ReleaseCellByIndex(index);
        }
        */

        _curActionIndex = 0;
        while (_curActionIndex < _curStep.actions.Count)
        {
            await StartAction();
        }

        if (!_curStep.isShowPlusButton)
        {
            _isCurStepEnd = true;
        }
        await UniTask.WaitUntil(() => _isCurStepEnd);
    }

    public void SetContentStep()
    {
        _stepTitleText.text = _curStep.title;
        _stepDescText.text = _curStep.content;
        _stepNumText.text = $"Steps: {_curStepIndex + 1}/{_tutorialNumberDataAsset.Steps.Count}";
    }

    private async UniTask StartAction()
    {
        _isCurActionEnd = false;
        _curAction = _curStep.actions[_curActionIndex];
        //_handTouch.Stop();
        if (_curAction.isReleaseAll) ReleaseAll();
        _curCellAction = new List<CellNumberController>();
        if (_curAction.cell1 != -1) _curCellAction.Add(_tableNumberController.GetCellByIndex(_curAction.cell1));
        if (_curAction.cell2 != -1) _curCellAction.Add(_tableNumberController.GetCellByIndex(_curAction.cell2));
        if (_curCellAction.Count == 2)
        {
            _tableNumberController.ReleaseCellByIndex(_curAction.cell1);
            _tableNumberController.ReleaseCellByIndex(_curAction.cell2);
            _tableNumberController.PlayVfxAttachCell(_vfxAttachCell,_curAction.cell1, _curAction.cell2);
            //if (_curAction.isHint) _tableNumberController.HintCell(_curCellAction);
            if (CanPlayHandTouchCell())
            {
                PlayHandTouchCell(_curStepIndex, _curActionIndex);
            }
        }
        await UniTask.WaitUntil(() => (_isCurActionEnd || (_curActionIndex >= _curStep.actions.Count)));
    }

    private void ReleaseAll()
    {
        _isReleaseAll = true;
        _tableNumberController.ReleaseAllCell();
        _practice.SetActive(true);
    }


    private void OnSkipButtonClicked()
    {
        ShowSkipModal();
    }
    
    private async UniTaskVoid ShowSkipModal()
    {
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_HowToPlaySkip", false);
        container.Push(option);
        
        var modal = await option.WindowCreated.WaitAsync() as HowToPlaySkipModal;
        if (modal != null) 
            modal.SetCallbackSkip(ClosePopup);
    }

    private void OnPlusButtonClicked(ButtonPlusClickPayload payload)
    {
        _isCurStepEnd = true;
        _handTouch.Stop();
    }
    
    
    private void OnBeforeClearCell(BeforeClearCellPayload payload)
    {
        _vfxAttachCell.Stop();
        _handTouch.Stop();
        if (_curAction.isRemoveMask)
        {
            _tableNumberController.RemoveMask();
        }
    }
    
    private void OnAfterClearCell(AfterClearCellPayload payload)
    {
        if (!_isReleaseAll)
        {
            foreach (var cell in _curCellAction)
            {
                cell.SetMask(true);
            }
        }
        
        if (_curAction.isDeleteRow)
        {
            _tableNumberController.DecreaseSizeTutorial();
        }
        _isCurActionEnd = true;
        _curActionIndex++;
    }

    protected virtual async void ClosePopup()
    {
        await UniTask.WaitForSeconds(1);
        var mainScreenContainer = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER_NO_DROP);
        if(mainScreenContainer)
            mainScreenContainer.Pop(false);
    }

    private async void PlayHandTouchCell(int stepIndex, int actionIndex)
    {
        var cells = new List<CellNumberController>();
        cells.AddRange(_curCellAction);
        
        _handTouch.transform.eulerAngles = Vector3.zero;
        
        while (cells.Count > 0 && _curStepIndex == stepIndex && _curActionIndex == actionIndex)
        {
            foreach (var cell in cells)
            {
                if (_curStepIndex != stepIndex || _curActionIndex != actionIndex || _isCurActionEnd) return;
                _handTouch.transform.position = cell.transform.position;
                await _handTouch.Play();
            }
        }
    }

    private bool CanPlayHandTouchCell()
    {
        return (_curActionIndex == 0);
    }
    
    public void ShowPopupHowToPlayComplete()
    {
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER_NO_DROP_2);
        var option = new WindowOption("PU_HowToPlayComplete", true);
        container.Push(option);
        ClosePopup();
    }

}
```

## File: HowToPlaySkipModal.cs/HowToPlaySkipModal.cs
```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class HowToPlaySkipModal : SlideFromDownPopupModal
{
    [SerializeField] Button _buttonSkip;
    private UnityAction _callbackSkip;
    
    void Start()
    {
        _buttonSkip.onClick.AddListener(OnClickSkip);
    }

    public void SetCallbackSkip(UnityAction callbackSkip)
    {
        _callbackSkip = callbackSkip;
    }
    
    private void OnClickSkip()
    {
        OnPressClose();
        _callbackSkip?.Invoke();
    }

}
```

## File: IngameChallengeCompleteModal.cs/IngameChallengeCompleteModal.cs
```csharp
using System;
using System.Globalization;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class IngameChallengeCompleteModal : CloseButtonPopup
{
    [SerializeField] private Button _btnNextGame;
    [SerializeField] private Button _btnHome;
    [SerializeField] private TextMeshProUGUI _txtResult;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    [SerializeField] UIParticle _effect;
    private UnityAction _onNextGameCallback;

    private void Awake()
    {
        _btnNextGame.onClick.AddListener(OnNextGameClicked);
        _btnHome.onClick.AddListener(OnHomeClicked);
    }
    
    public override UniTask Initialize()
    {
        base.Initialize();
        string date = _roundDataAsset.DateChallenge.ToString("MMMM dd", new CultureInfo("en-US"));
        _txtResult.text = $"Daily Challenge for {date} completed !";
        _effect.Play();
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayWinDC"});
        return UniTask.CompletedTask;
    }
    
    public override void DidPushEnter()
    {
        base.DidPushEnter();
        var common = new InGameStageFinishCommon();
        common.DidPushEnter(ScreenName.DailyChallengeComplete);
    }
    

    private void OnHomeClicked()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload());
    }
    
    private void OnNextGameClicked()
    {
        _onNextGameCallback?.Invoke();
        base.ClosePopup();
    }

    public void Setup(UnityAction onNextGameCallback)
    {
        _onNextGameCallback = onNextGameCallback;
    }
}
```

## File: IngameChallengeEndModal.cs/IngameChallengeEndModal.cs
```csharp
using System;
using System.Globalization;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class IngameChallengeEndModal : CloseButtonPopup
{
    [SerializeField] private Button _btnRetry;
    [SerializeField] private Button _btnHome;
    [SerializeField] private TextMeshProUGUI _txtResult;
    [SerializeField] private Image _progress;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    [SerializeField] UIParticle _effect;
    private UnityAction _onRetryCallback;

    private void Awake()
    {
        _btnRetry.onClick.AddListener(OnRetryClicked);
        _btnHome.onClick.AddListener(OnHomeClicked);
    }
    
    public override UniTask Initialize()
    {
        base.Initialize();
        float percent = 1.0f * _roundDataAsset.CurrentData.currentScore / _roundDataAsset.CurrentData.bestScore; 
        _txtResult.text = $"Completed {Mathf.FloorToInt(percent*100)}%";
        _progress.fillAmount = Mathf.Clamp01(percent);
        _effect.Play();
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayLoseDC"});
        return UniTask.CompletedTask;
    }
    
    public override void DidPushEnter()
    {
        base.DidPushEnter();
        var common = new InGameStageFinishCommon();
        common.DidPushEnter(ScreenName.DailyChallengeEnd);
    }

    private void OnHomeClicked()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload());
    }
    
    private void OnRetryClicked()
    {
        _onRetryCallback?.Invoke();
        base.ClosePopup();
    }

    public void Setup(UnityAction onRetryCallback)
    {
        _onRetryCallback = onRetryCallback;
    }
}
```

## File: IngameInform.cs/IngameInform.cs
```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using BrunoMikoski.AnimationSequencer;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;

public class IngameInform : MonoBehaviour
{
    private class InformTask
    {
        public Func<UniTask> task;

        public InformTask(Func<UniTask> task)
        {
            this.task = task;
        }
    }
    
    [Header("BestScore")]
    [SerializeField] private AnimationSequencerController _bestScoreAnim;
    [SerializeField] private UIParticle _bestScoreFx;
    
    [Header("AllPairCompleted")]
    [SerializeField] private AnimationSequencerController _allPairCompletedAnim;
    
    [Header("NewStage")]
    [SerializeField] private AnimationSequencerController _newStageAnim;
    [SerializeField] private TextMeshProUGUI _newStageText;
    
    [Header("NumberCompleted")]
    [SerializeField] private AnimationSequencerController _numberCompletedAnim;
    [SerializeField] private UIParticle _numberCompletedFx;
    [SerializeField] private TextMeshProUGUI _numberCompletedText;
    
    [Header("NoMoreMatches")]
    [SerializeField] private AnimationSequencerController _noMoreMatchesAnim;

    private readonly Queue<InformTask> _tasks = new Queue<InformTask>();
    private bool _isRunning = false;

    private void Start()
    {
        Messenger.Default.Subscribe<ButtonPlusSayPayload>(OnButtonPlusSay);
        Messenger.Default.Subscribe <ButtonPlusClickPayload> (OnButtonPlusClick);
        Messenger.Default.Subscribe<BestScoreNewPayload>(OnBestScoreNew);
        Messenger.Default.Subscribe<StageStartPayload>(OnStageStart);
        Messenger.Default.Subscribe<StageNewPayload>(OnStageNew);
        Messenger.Default.Subscribe<NumberCompletedPayload>(OnNumberCompleted);
        Messenger.Default.Subscribe<NoMoreMatchesPayload>(OnNoMoreMatches);
    }

    private void OnDestroy()
    {
        Messenger.Default.Unsubscribe<ButtonPlusSayPayload>(OnButtonPlusSay);
        Messenger.Default.Unsubscribe<BestScoreNewPayload>(OnBestScoreNew);
        Messenger.Default.Unsubscribe<ButtonPlusClickPayload>(OnButtonPlusClick);
        Messenger.Default.Unsubscribe<StageStartPayload>(OnStageStart);
        Messenger.Default.Unsubscribe<NumberCompletedPayload>(OnNumberCompleted);
        Messenger.Default.Unsubscribe<StageNewPayload>(OnStageNew);
        Messenger.Default.Unsubscribe<NoMoreMatchesPayload>(OnNoMoreMatches);
    }

    private void OnNoMoreMatches(NoMoreMatchesPayload payload)
    {
        Enqueue(async () =>
        {
            _noMoreMatchesAnim.gameObject.SetActive(true);
            _noMoreMatchesAnim.Play();
            await UniTask.WaitUntil(() => !_noMoreMatchesAnim.IsPlaying);
            payload.status.IsCompleted = true;
        });
    }

    private void OnNumberCompleted(NumberCompletedPayload payload)
    {
        Enqueue(async () =>
        {
            _numberCompletedAnim.gameObject.SetActive(true);
            _numberCompletedText.text = payload.number.ToString();
            _numberCompletedAnim.Play();
            _numberCompletedFx.Stop();
            _numberCompletedFx.Play();
            await UniTask.WaitUntil(() => !_numberCompletedAnim.IsPlaying);
        });
    }

    private void OnBestScoreNew(BestScoreNewPayload payload)
    {
        if (payload.isChallenge) return;
        Enqueue(async () =>
        {
            _bestScoreAnim.gameObject.SetActive(true);
            _bestScoreAnim.Play();
            _bestScoreFx.Stop();
            _bestScoreFx.Play();
            await UniTask.WaitUntil(() => !_bestScoreAnim.IsPlaying);
        });
        
    }
    
    private void OnButtonPlusSay(ButtonPlusSayPayload payload)
    {
        _allPairCompletedAnim.gameObject.SetActive(true);
        _allPairCompletedAnim.Play();
    }
    
    private void OnButtonPlusClick(ButtonPlusClickPayload payload)
    {
        if (_allPairCompletedAnim.IsPlaying) _allPairCompletedAnim.SetProgress(1);
    }
    
    private void OnStageStart(StageStartPayload payload)
    {
        _tasks.Clear();
        _isRunning = false;
    }
    
    private void OnStageNew(StageNewPayload payload)
    {
        _newStageAnim.gameObject.SetActive(true);
        _newStageText.text = $"Stage {payload.stage}";
        _newStageAnim.Play();
    }

    public void Enqueue(Func<UniTask> taskFunc)
    {
        _tasks.Enqueue(new InformTask(taskFunc));
        if (!_isRunning)
        {
            _ = ProcessQueueAsync(); // Fire-and-forget
        }
    }
    
    private async UniTaskVoid ProcessQueueAsync()
    {
        _isRunning = true;

        while (_tasks.Count > 0)
        {
            var currentTask = _tasks.Dequeue();

            try
            {
                await currentTask.task();
            }
            catch (Exception ex)
            {
                Debug.LogError($"InformTaskQueue error: {ex}");
            }
        }

        _isRunning = false;
    }

}
```

## File: IngameSettingModal.cs/IngameSettingModal.cs
```csharp
using System.Collections;
using System.Collections.Generic;
using SuperMaxim.Messaging;
using UnityEngine;
using UnityEngine.UI;

public class IngameSettingModal : SlideFromDownPopupModal
{
    [SerializeField] private SettingDataAsset settingDataAsset;

    [SerializeField] private Button musicBtn;
    [SerializeField] private GameObject musicOnObj;
    [SerializeField] private GameObject musicOffObj;

    [SerializeField] private Button soundBtn;
    [SerializeField] private GameObject soundOnObj;
    [SerializeField] private GameObject soundOffObj;

    [SerializeField] private Button vibrateBtn;
    [SerializeField] private GameObject vibrateOnObj;
    [SerializeField] private GameObject vibrateOffObj;
    
    [SerializeField] private Button btnGoHome;
    
    protected override void Start()
    {
        base.Start();

        musicBtn.onClick.AddListener(ChangeMusic);
        musicOnObj.SetActive(settingDataAsset.IsUseMusic);
        musicOffObj.SetActive(!settingDataAsset.IsUseMusic);

        soundBtn.onClick.AddListener(ChangeSound);
        soundOnObj.SetActive(settingDataAsset.IsUseSound);
        soundOffObj.SetActive(!settingDataAsset.IsUseSound);

        vibrateBtn.onClick.AddListener(ChangeVibrate);
        vibrateOnObj.SetActive(settingDataAsset.IsUseVibrate);
        vibrateOffObj.SetActive(!settingDataAsset.IsUseVibrate);
        
        btnGoHome.onClick.AddListener(OnQuitGame);
    }
    
    private void ChangeMusic()
    {
        settingDataAsset.ClickMusic();
        musicOnObj.SetActive(settingDataAsset.IsUseMusic);
        musicOffObj.SetActive(!settingDataAsset.IsUseMusic);
    }

    private void ChangeSound()
    {
        settingDataAsset.ClickSound();
        soundOnObj.SetActive(settingDataAsset.IsUseSound);
        soundOffObj.SetActive(!settingDataAsset.IsUseSound);
    }

    private void ChangeVibrate()
    {
        settingDataAsset.ClickVibrate();
        vibrateOnObj.SetActive(settingDataAsset.IsUseVibrate);
        vibrateOffObj.SetActive(!settingDataAsset.IsUseVibrate);
    }
    
    private void OnQuitGame()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload() { });
    }
}
```

## File: IngameStageCompleteModal.cs/IngameStageCompleteModal.cs
```csharp
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using SuperMaxim.Messaging;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public class IngameStageCompleteModal : CloseButtonPopup
{
    [SerializeField] private Button _btnNextStage;
    [SerializeField] private Button _btnHome;
    [SerializeField] UIParticle _effect;
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    private UnityAction _onNextStageCallback;

    private void Awake()
    {
        _btnNextStage.onClick.AddListener(OnNextStageClicked);
        _btnHome.onClick.AddListener(OnHomeClicked);
    }
    
    public override UniTask Initialize()
    {
        base.Initialize();
        _effect.Play();
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayWinDC"});
        return UniTask.CompletedTask;
    }
    
    public override void DidPushEnter()
    {
        base.DidPushEnter();
        var common = new InGameStageFinishCommon();
        common.DidPushEnter(ScreenName.StageComplete);
    }

    private void OnHomeClicked()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload());
    }

    private void OnNextStageClicked()
    {
        base.ClosePopup();
        _onNextStageCallback?.Invoke();
    }

    public void SetupNextStage(UnityAction onNextStageCallback)
    {
        _onNextStageCallback = onNextStageCallback;
    }
}
```

## File: IngameStageEndModal.cs/IngameStageEndModal.cs
```csharp
using System;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using GameFeatures.Common;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using UnityScreenNavigator.Runtime.Core.Modal;
using UnityScreenNavigator.Runtime.Core.Shared;

public class IngameStageEndModal : CloseButtonPopup
{
    [SerializeField] private Button _btnNewRound;
    [SerializeField] private Button _btnHome;
    [SerializeField] private TextMeshProUGUI _txtBestScore;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    [SerializeField] UIParticle _effect;
    private UnityAction _onNewRoundCallback;

    private void Awake()
    {
        _btnNewRound.onClick.AddListener(OnNewRoundClicked);
        _btnHome.onClick.AddListener(OnHomeClicked);
        _txtBestScore.text = _roundDataAsset.CurrentData.bestScore.ToString();
    }
    
    public override UniTask Initialize()
    {
        base.Initialize();
        _effect.Play();
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayLoseDC"});
        return UniTask.CompletedTask;
    }
    
    public override void DidPushEnter()
    {
        base.DidPushEnter();
        var common = new InGameStageFinishCommon();
        common.DidPushEnter(ScreenName.StageEnd);
    }
    
    private void OnHomeClicked()
    {
        Messenger.Default.Publish(new HomeButtonClickedPayload());
    }
    
    private void OnNewRoundClicked()
    {
        _onNewRoundCallback?.Invoke();
        base.ClosePopup();
    }

    public void SetupNewRound(UnityAction onNewRoundCallback)
    {
        _onNewRoundCallback = onNewRoundCallback;
    }
}
```

## File: InGameStageFinishCommon.cs/InGameStageFinishCommon.cs
```csharp
using Cysharp.Threading.Tasks;
using GameFeatures.Common;
using UnityScreenNavigator.Runtime.Core.Modal;
using UnityScreenNavigator.Runtime.Core.Shared;

public class InGameStageFinishCommon
{
    public void DidPushEnter(string screenName)
    {
        var homeDataAsset = NumberMatchService.Instance.Get<NumberMatchHomeDataAsset>();
        if (homeDataAsset.NumberMatchStart > homeDataAsset.First_MATCH_SHOW_ADS)
        {
            ShowAds(screenName);
        }
        else
        {
            if (homeDataAsset.NumberMatchStart == homeDataAsset.First_MATCH_SHOW_ADS)
            {
                ShowRemoveAdsPopup(screenName);
            }
        }
    }
    
    public async void ShowAds(string screenName)
    {
        await UniTask.WaitForSeconds(1);
        AdManager.Instance.ShowInterstitialOrCenterMRecAds(ScenePlaceAds.InGame, screenName: screenName,
            onOpenAd: info =>
                AnalyticManager.Instance.LogAdTrigger(new AdTriggerParam()
                    { AdInfo = info, Screen = screenName }),
            onAdPaid: info =>
                AnalyticManager.Instance.LogAdImpression(new AdImpressionParam()
                    { AdInfo = info, Screen = screenName }),
            allowI1:true
        ).Forget();
    }

    public async void ShowRemoveAdsPopup(string screenName)
    {
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_RemoveAdsMe", true);
        container.Push(option);
        
        var removeAdsMe = await option.WindowCreated.WaitAsync() as RemoveAdsMe;
        if (removeAdsMe != null) 
            removeAdsMe.SetOnCloseShowAs(ScenePlaceAds.InGame, screenName);
    }
}
```

## File: NumberMatchGamePlayLogic.cs/NumberMatchGamePlayLogic.cs
```csharp
using System;
using Cysharp.Threading.Tasks;
using GameFeatures.Common;
using MainGame.MainScreen;
using SuperMaxim.Messaging;
using UnityEngine;
using UnityScreenNavigator.Runtime.Core.Modal;
using UnityScreenNavigator.Runtime.Core.Shared;

public class NumberMatchGamePlayLogic : MonoBehaviour
{
    [SerializeField] RoundDataAsset _roundDataAsset;
    [SerializeField] NumberMatchHomeDataAsset _numberMatchHomeDataAsset;
    [SerializeField] private ChallengeDataAsset _challengeDataAsset;
    [SerializeField] TableNumberController _tableNumberController;
    
    private async void Start()
    {
        Messenger.Default.Subscribe<HomeButtonClickedPayload>(OnHomeButtonClicked);
        Messenger.Default.Subscribe<IngameSettingButtonClickedPayload>(OnIngameSettingButtonClicked);
        Messenger.Default.Subscribe<BestScoreNewPayload>(OnBestScoreNew);
        Messenger.Default.Subscribe<IngameCheatResetTablePayload>(OnCheatResetTable);
        await UniTask.DelayFrame(1);
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayIngameBg"});
        StartStage();
    }

    private void OnIngameSettingButtonClicked(IngameSettingButtonClickedPayload payload)
    {
        ShowPopupSetting();
    }

    private void OnDestroy()
    {
        Messenger.Default.Unsubscribe<HomeButtonClickedPayload>(OnHomeButtonClicked);
        Messenger.Default.Unsubscribe<IngameSettingButtonClickedPayload>(OnIngameSettingButtonClicked);
        Messenger.Default.Unsubscribe<BestScoreNewPayload>(OnBestScoreNew);
        Messenger.Default.Unsubscribe<IngameCheatResetTablePayload>(OnCheatResetTable);
    }

    private void OnCheatResetTable(IngameCheatResetTablePayload payload)
    {
        StartStage();
    }

    private void OnHomeButtonClicked(HomeButtonClickedPayload payload)
    {
        LoadingScene.Instance.LoadingGameToHome();
    }

    private async UniTask StartStage()
    {
        var numbers = _roundDataAsset.CurrentData.DecodeNumbers();
        Messenger.Default.Publish(new StageStartPayload()
        {
            data = _roundDataAsset.CurrentData,
            isChallenge = _roundDataAsset.IsChallenge,
        });
        await _tableNumberController.SetUpNewTable(numbers);
        if (_roundDataAsset.CurrentData.isStageNew)
        {
            Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayNewStage"});
            Messenger.Default.Publish(new StageNewPayload { stage = _roundDataAsset.CurrentData.stage });
        }
        await _tableNumberController.AfterLoading(numbers);
    }
    
    public async void OnChallengeNextGameCallBack()
    {
        _numberMatchHomeDataAsset.IsSetUpFirstScene = true;
        _numberMatchHomeDataAsset.ScreenLoadFirst = ScrollMainUIContent.ScreenType.DailyChallenge;
        _numberMatchHomeDataAsset.ChallengeDate = _roundDataAsset.DateChallenge.AddDays(1);
        OnHomeButtonClicked(new HomeButtonClickedPayload());
    }
    
    public async void OnChallengeRetryCallBack()
    {
        _roundDataAsset.GenNewEmptyRound(_roundDataAsset.CurrentData.bestScore);
        StartStage();
    }

    public void OnNextStageCallBack()
    {
        StartStage();
    }
    
    
    private void OnBestScoreNew(BestScoreNewPayload payload)
    {
        if (payload.isChallenge)
        {
            ShowPopupChallengeComplete();
        }
    }

    public void OnNewRoundCallBack()
    {
        _roundDataAsset.GenNewEmptyRound(Mathf.Max(_roundDataAsset.CurrentData.bestScore,
            _roundDataAsset.CurrentData.currentScore));

        StartStage();
    }
    
    public async UniTaskVoid ShowPopupStageComplete()
    {
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_StageComplete", true);
        container.Push(option);
        
        _roundDataAsset.GenNextStage();
        var ingameStageCompleteModal = await option.WindowCreated.WaitAsync() as IngameStageCompleteModal;
        if (ingameStageCompleteModal != null) 
            ingameStageCompleteModal.SetupNextStage(OnNextStageCallBack);
        
    }
    
    public async UniTaskVoid ShowPopupStageEnd()
    {
        _roundDataAsset.FinishRound();
        
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_StageEnd", true);
        container.Push(option);
        
        var ingameStageEndModal = await option.WindowCreated.WaitAsync() as IngameStageEndModal;
        if (ingameStageEndModal != null) 
            ingameStageEndModal.SetupNewRound(OnNewRoundCallBack);
    }
    
    public async UniTaskVoid ShowPopupChallengeComplete()
    {
        _roundDataAsset.FinishRound();
        
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_ChallengeComplete", true);
        container.Push(option);

        var date = _roundDataAsset.DateChallenge;
        if (_challengeDataAsset.GetNumDayCompletedOfMonth(date.Year, date.Month) == DateTime.DaysInMonth(date.Year, date.Month) && !_challengeDataAsset.HasReceiveCup(date.Year, date.Month))
        {
            _numberMatchHomeDataAsset.CupReceive = _roundDataAsset.DateChallenge;
        }
        
        var ingameChallengeCompleteModal = await option.WindowCreated.WaitAsync() as IngameChallengeCompleteModal;
        if (ingameChallengeCompleteModal != null)
            ingameChallengeCompleteModal.Setup(OnChallengeNextGameCallBack);
    }
    
    public async UniTaskVoid ShowPopupChallengeEnd()
    {
        _roundDataAsset.FinishRound();
        
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_ChallengeEnd", true);
        container.Push(option);
        
        var ingameChallengeEndModal = await option.WindowCreated.WaitAsync() as IngameChallengeEndModal;
        if (ingameChallengeEndModal != null) 
            ingameChallengeEndModal.Setup(OnChallengeRetryCallBack);
    }
    
    public async UniTaskVoid ShowPopupSetting()
    {
        var container = ModalContainer.Find(LayerConstKey.MODAL_CONTAINER);
        var option = new WindowOption("PU_IngameSetting", false);
        container.Push(option);
    }
}
```

## File: RoundManager.cs/RoundManager.cs
```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RoundManager : MonoBehaviour
{
    
}
```

## File: StageUIInfo.cs/StageUIInfo.cs
```csharp
using System.Text;
using SuperMaxim.Messaging;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class StageUIInfo : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI _stageText;
    [SerializeField] private TextMeshProUGUI _scoreText;
    [SerializeField] private TextMeshProUGUI _bestScoreText;
    [SerializeField] private TextMeshProUGUI _completeNumberText;
    [SerializeField] private GameObject _iconCrown;
    [SerializeField] private GameObject _iconGoal;
    [SerializeField] private GameObject _bestScoreParent;
    [SerializeField] private Button _buttonSetting;
    
    private int[] _digits;
    
    private void Start()
    {
        _buttonSetting.onClick.AddListener(OnSettingClick);
        
        Messenger.Default.Subscribe<ClearNumberPayload>(OnClearNumberPayload);
        Messenger.Default.Subscribe<ScoreChangePayload>(OnScoreChange);
        Messenger.Default.Subscribe<StageStartPayload>(OnStageStart);
        Messenger.Default.Subscribe<ButtonPlusClickPayload>(OnButtonPlusClick);
        Messenger.Default.Subscribe<BestScoreNewPayload>(OnBestScoreNew);
    }

    private void OnDestroy()
    {
        Messenger.Default.Unsubscribe<ClearNumberPayload>(OnClearNumberPayload);
        Messenger.Default.Unsubscribe<ScoreChangePayload>(OnScoreChange);
        Messenger.Default.Unsubscribe<StageStartPayload>(OnStageStart);
        Messenger.Default.Unsubscribe<ButtonPlusClickPayload>(OnButtonPlusClick);
        Messenger.Default.Unsubscribe<BestScoreNewPayload>(OnBestScoreNew);
    }

    private void OnBestScoreNew(BestScoreNewPayload payload)
    {
        _bestScoreParent.SetActive(false);
    }

    private void OnStageStart(StageStartPayload payload)
    {
        _stageText.text = $"Stage {payload.data.stage}";
        _scoreText.text = payload.data.currentScore.ToString();
        _bestScoreText.text = payload.data.bestScore.ToString();
        _iconCrown.gameObject.SetActive(!payload.isChallenge);
        _iconGoal.gameObject.SetActive(payload.isChallenge);
        _bestScoreParent.SetActive(payload.data.bestScore > 0);
        InitDigit(payload.data);
    }

    private void InitDigit(RoundDataAsset.RoundSaveData data)
    {
        _digits = new int[10];
        for (int i = 0; i < 10; i++)
        {
            _digits[i] = 0;
        }
        foreach (var number in data.DecodeNumbers())
        {
            if (number > 0 && number < 10) _digits[number]++;
        }

        StringBuilder s = new StringBuilder();
        for (int i = 1; i < 10; i++)
        {
            if (i > 1) s.Append(" ");
            if (_digits[i] > 0) s.Append(i);
            else s.Append("\u2713");
        }

        _completeNumberText.text = s.ToString();
    }
    
    private void OnButtonPlusClick(ButtonPlusClickPayload payload)
    {
        InitDigit(payload.data);
    }

    private void OnScoreChange(ScoreChangePayload payload)
    {
        _scoreText.text = payload.score.ToString();
    }

    private void OnClearNumberPayload(ClearNumberPayload payload)
    {
        _digits[payload.number]--;
        if (_digits[payload.number] <= 0)
        {
            _completeNumberText.text = _completeNumberText.text.Replace(payload.number.ToString(),"\u2713");
            Messenger.Default.Publish(new NumberCompletedPayload() { number = payload.number });
        }
    }
    
    private void OnSettingClick()
    {
        Messenger.Default.Publish(new IngameSettingButtonClickedPayload());
    }
}
```

## File: TableNumberController.cs/TableNumberController.cs
```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Coffee.UIExtensions;
using Cysharp.Threading.Tasks;
using DG.Tweening;
using SuperMaxim.Messaging;
using UnityEngine;
using UnityEngine.UI;
using Random = UnityEngine.Random;

public class TableNumberController : MonoBehaviour
{
    #region Consts & Enums
    private const int TARGET_SUM = 10;
    public enum TableDirect
    {
        RightBot = 0,
        Bottom = 1,
        LeftBot = 2,
        Right = 3,
        
    }
    #endregion
    
    #region Inspector References
    private (int x, int y)[] directions = { (1, 1), (1, 0), (1, -1), (0, 1) };
    
    [Header("References")]
    [SerializeField] private RectTransform _tableRect;
    [SerializeField] private RectTransform _viewPort; 
    [SerializeField] private RectTransform _tableContainer; // Content trong ScrollView
    [SerializeField] private CellNumberController _cellPrefab;            // Prefab chứa CellNumberController
    [SerializeField] private ScrollRect _scrollRect;
    [SerializeField] private Transform _startPos;
    [SerializeField] private RoundDataAsset _roundDataAsset;
    [SerializeField] private NumberMatchHomeDataAsset _homeDataAsset;
    [SerializeField] private Transform _vfxParent;
    [SerializeField] private ComboVfxClearCellController _vfxClearCellPrefab;
    [SerializeField] private ComboVfxDeleteRowController _vfxDeleteRowPrefab;
    [SerializeField] private ComboVfxAttachCellController _vfxAttachCell;
    [SerializeField] private UIParticle _vfxNewCellPrefab;
    [SerializeField] private UIParticle _vfxHint;
    [SerializeField] private GameObject _scoreEffectPrefab;
    [SerializeField] private NumberMatchGamePlayLogic _numberMatchGamePlayLogic;
    [SerializeField] private GameObject _lock;

    [Header("Settings")]
    [SerializeField] private int _columnNum = 9;
    [SerializeField] private int _initialCellCount = 35;
    [SerializeField] private int _scoreOne = 1;
    [SerializeField] private int _scoreTwo = 2;
    [SerializeField] private int _scoreHaveSpace = 4;
    [SerializeField] private int _scoreDeleteRow = 10;
    [SerializeField] private int _scoreDeleteTable = 150;
    [SerializeField] private float _score_increae_rate = 0.2f;
    #endregion
    
    #region State
    private List<List<CellNumberController>> _table = new();
    private float _cellSize;
    private int _rowNum = 0;
    private CellNumberController _selectedCell;
    private CellNumberController _lastHaveNumberCell;
    private List<CellNumberController> _cellHints = new List<CellNumberController>();
    private bool _isTutorial = false;
    private bool _isLocked = false;
    private bool _isInitialized = false;
    #endregion

    #region Init & Setup
    public async UniTask InitTable(int rowInit)
    {
        // Xoá bảng cũ
        /*
        foreach (Transform child in _tableContainer)
        {
            DestroyImmediate(child.gameObject);
        }
        */
        _tableContainer.DestroyAllChildren();
        await UniTask.DelayFrame(2);
        _table.Clear();
        _rowNum = 0;

        // Tính kích thước cell
        float width = _viewPort.rect.width;
        _cellSize = width / _columnNum;

        // Tạo bảng mới
        SetScrollPos(1f);
        int totalRows = Mathf.Max(Mathf.CeilToInt(_tableContainer.rect.height / _cellSize), rowInit);
        int numberCreated = 0;

        for (int i = 0; i < totalRows; i++)
        {
            AddRow(); // sẽ tăng _currentRow
            if (i%11 == 0) await UniTask.NextFrame();
        }
        LayoutRebuilder.ForceRebuildLayoutImmediate(_tableContainer);
        await UniTask.DelayFrame(1);
        SetScrollPos(1f);
        RefreshPosContent();
        _isInitialized = true;
    }

    public void SetTutorial(bool isTutorial)
    {
        _isTutorial = isTutorial;
    }

    public async UniTask SetUpNewTable(List<int> numbers)
    {
        _score_increae_rate = NumberMatchService.Instance.NumberMatchCustomRemoteConfigData.IncreasingRate;
        _isInitialized = false;
        _table.Clear();
        await LockTable(false);
        _rowNum = 0;
        _selectedCell = null;
        _lastHaveNumberCell = null;
        _cellHints.Clear();
        
        await InitTable((numbers.Count - 1)/_columnNum + 1 + 15);
    }

    public async UniTask AfterLoading(List<int> numbers)
    {
        await UniTask.WaitUntil(() => !LoadingScene.Instance.IsActive && _isInitialized);
        await AddListNumber(numbers,true);
    }
    
    private void AddRow()
    {
        var row = new List<CellNumberController>();
        for (int col = 0; col < _columnNum; col++)
        {
            CellNumberController cell = Instantiate(_cellPrefab, _tableContainer);
            cell.SetUpNew(_rowNum, col, _cellSize,
                _startPos.position + new Vector3(0, _tableContainer.anchoredPosition.y, 0) + new Vector3(
                    (col + 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x,
                    (_rowNum + 0.5f) * (-1) * _cellSize * _tableContainer.transform.lossyScale.y, 0));
            
            if (!_isTutorial)
            {
                cell.SetCallBack(OnCellClicked);
            }
            else
            {
                cell.SetMask(true);
            }
            
            cell.transform.name = $"Cell ({_rowNum}, {col})";

            row.Add(cell);
        }
        _table.Add(row);
        _rowNum++;
        //ScrollToBottom();
    }
    #endregion
    
    #region Update Scroll
    
    void Update()
    {
        if (!_isLocked)
        {
            if (_scrollRect.verticalNormalizedPosition < MinScrollPos())
            {
                SetScrollPos(MinScrollPos());
            }
        }
    }

    private void SetScrollPos(float value)
    {
        if (_isTutorial) value = 1f;
        _scrollRect.verticalNormalizedPosition = value;
    }

    private float MinScrollPos()
    {
        if (!_lastHaveNumberCell || _isTutorial) return 1;
        return ScrollPosRowEnd(_lastHaveNumberCell.RowIndex);
    }

    private float ScrollPosRowEnd(int row)
    {
        float minScroll = 1 - ((row + 3.5f) * _cellSize - _viewPort.rect.height) /
            (_tableContainer.rect.height - _viewPort.rect.height);
        return Mathf.Clamp01(minScroll);
    }
    #endregion
    
    #region Random & Utility Number

    private List<int> RandomNumberForCell()
    {
        List<int> numbers = new List<int>();
        for (int i = 0; i < _initialCellCount; i++)
        {
            numbers.Add(Random.Range(1, 10));
        }
        return numbers;
    }

    private List<int> GetListNumberInTable()
    {
        List<int> numbers = new List<int>();
        for (int i = 0; i < _rowNum; i++)
        {
            for (int j = 0; j < _columnNum; j++)
            {
                if (_table[i][j].IsActive) numbers.Add(_table[i][j].CellNumber);
            }
        }
        return numbers;
    }
    
    private List<int> GetAllListNumberInTable()
    {
        _lastHaveNumberCell = FindLastHaveNumberCell();
        List<int> numbers = new List<int>();
        if (_lastHaveNumberCell)
        {
            for (int i = 0; i < _rowNum; i++)
            {
                for (int j = 0; j < _columnNum; j++)
                {
                    if (GetIndexByRowCol(i,j) <= GetIndexByRowCol(_lastHaveNumberCell.RowIndex, _lastHaveNumberCell.ColumnIndex))
                    {
                        numbers.Add(_table[i][j].CellNumber);
                    }
                }
            }
        }
        return numbers;
    }
    #endregion
    
    #region Cell Positioning & Access

    private CellNumberController FindLastHaveNumberCell()
    {
        CellNumberController lastHaveNumberCell = null;
        for (int row = 0; row < _rowNum; row++)
        {
            for (int col = 0; col < _columnNum; col++)
            {
                if (!_table[row][col].IsEmpty)
                {
                    lastHaveNumberCell = _table[row][col];
                }
            }
        }

        return lastHaveNumberCell;
    }
    
    
    private void RefreshPosContent()
    {
        for (int i = 0; i < _rowNum; i++)
        {
            for (int j = 0; j < _columnNum; j++)
            {
                var cell = _table[i][j];
                cell.ResetIndexAndPos(i,j,
                    _startPos.position + new Vector3(0, _tableContainer.anchoredPosition.y, 0) + new Vector3(
                        (j + 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x,
                        (i + 0.5f) * (-1) * _cellSize * _tableContainer.transform.lossyScale.y, 0));
            }
        }
    }
    
    private int GetIndexByRowCol(int row, int col)
    {
        return row * _columnNum + col;
    }
    
    private int GetIndexByCell(CellNumberController cell)
    {
        return GetIndexByRowCol(cell.RowIndex, cell.ColumnIndex);
    }

    public CellNumberController GetCellByIndex(int index)
    {
        int row = index / _columnNum;
        int col = index % _columnNum;
        if (row < 0 || row >= _rowNum || col < 0 || col >= _columnNum) return null;
        return _table[row][col];
    }
    
    
    private CellNumberController GetNextCell(CellNumberController cell)
    {
        if (cell == null) return _table[0][0];
        int row = cell.RowIndex + (cell.ColumnIndex + 1) / _columnNum;
        int col = (cell.ColumnIndex + 1) % _columnNum;

        if (row >= _rowNum) return null;
        return _table[row][col];
    }

    private CellNumberController GetCellActiveByIndex(int index)
    {
        var cell = _table[0][0];
        if (!cell || !cell.IsActive) GetCellLink(0, 0, (int)TableDirect.Right);
        while (index > 0)
        {
            cell = GetCellLink(cell.RowIndex, cell.ColumnIndex, (int)TableDirect.Right);
            index--;
        }
        return cell;
    }
    
    #endregion
    
    #region Link Cells
    private void ResetLinkCell()
    {
        for (int i = _rowNum - 1; i >= 0; i--)
        {
            for (int j = _columnNum - 1; j >= 0; j--)
            {
                var cell = _table[i][j];
                for (int k = 0; k < directions.Length; k++)
                {
                    cell.SetCellLink(k,1);
                    cell.SetCellLink(k,FindCellLink(i,j,k));
                }
            }
        }
    }

    private int FindCellLink(int row, int column, int direct)
    {
        var cell = _table[row][column];
        int k = cell.GetCellLink(direct);

        int nextRow = row + directions[direct].x * k;
        int nextColumn = column + directions[direct].y * k;

        if (nextRow == row)
        {
            nextRow += nextColumn / _columnNum;
            nextColumn %= _columnNum;
        }

        if (nextRow >= _rowNum || nextColumn >= _columnNum || nextRow < 0 || nextColumn < 0 || _table[nextRow][nextColumn].IsActive)
        {
            cell.SetCellLink(direct, k);
            return k;
        }
        
        k += FindCellLink(nextRow, nextColumn, direct);
        cell.SetCellLink(direct, k);
        return k;
    }

    public CellNumberController GetCellLink(int row, int column, int direct)
    {
        int k = FindCellLink(row, column, direct);
        int nextRow = row + directions[direct].x * k;
        int nextColumn = column + directions[direct].y * k;
        
        if (nextRow == row)
        {
            nextRow += nextColumn / _columnNum;
            nextColumn %= _columnNum;
        }
        
        if (nextRow >= _rowNum || nextColumn >= _columnNum || nextRow < 0 || nextColumn < 0 ||
            !_table[nextRow][nextColumn].IsActive)
        {
            return null;
        }
        else
        {
            return _table[nextRow][nextColumn];
        }
    }
    #endregion
    
    #region Cell Selection & Click
    
    private async void OnCellClicked(CellNumberController clicked)
    {
        Debug.Log($"Cell clicked: ({clicked.CellNumber}) at row {clicked.name}");
        
        if (!clicked.IsActive) return;
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayTapNumber"});

        if (_selectedCell && _selectedCell == clicked)
        {
            _selectedCell.SetSelected(false);
            _selectedCell = null;
            return;
        }
        
        if (!CheckTwoCell(_selectedCell, clicked))
        {
            if (_selectedCell) _selectedCell.SetSelected(false);
            _selectedCell = clicked;
            _selectedCell.SetSelected(true);
            return;
        }
        
        var selectedCell = _selectedCell;
        _selectedCell.SetSelected(false);
        _selectedCell = null;
        await HandleTwoCellSelected(selectedCell, clicked);
    }

    private bool CheckTwoCell(CellNumberController cell1, CellNumberController cell2)
    {
        return (cell1 && cell2 && cell1.IsActive && cell2.IsActive &&
                (cell1.CellNumber == cell2.CellNumber || cell1.CellNumber + cell2.CellNumber == TARGET_SUM));
    }

    private bool CheckTwoCellHint(CellNumberController cell1, CellNumberController cell2)
    {
        if (!CheckTwoCell(cell1, cell2))
        {
            return false;
        }

        int row1 = cell1.RowIndex;
        int col1 = cell1.ColumnIndex;
        int row2 = cell2.RowIndex;
        int col2 = cell2.ColumnIndex;
        
        for (int k = 0; k < directions.Length; k++)
        {
            if (GetCellLink(row1, col1, k) == cell2 || GetCellLink(row2, col2, k) == cell1)
            {
                return true;
            }
        }
        return false;
    }

    private CellNumberController CheckTwoCellInDirect(CellNumberController cell1, CellNumberController cell2, int direct)
    {
        if (cell1 == cell2) return null;
        if (GetIndexByRowCol(cell1.RowIndex, cell1.ColumnIndex) > GetIndexByRowCol(cell2.RowIndex, cell2.ColumnIndex))
        {
            var temp = cell1;
            cell1 = cell2;
            cell2 = temp;
        }
        
        if (direct == (int)TableDirect.Right) return cell1;
        
        int k1 = cell2.RowIndex - cell1.RowIndex;
        int k2 = cell2.ColumnIndex - cell1.ColumnIndex;
        int k = Mathf.Max(Mathf.Abs(k1), Mathf.Abs(k2));

        if ((cell1.RowIndex + directions[direct].x * k, cell1.ColumnIndex + directions[direct].y * k) ==
            (cell2.RowIndex, cell2.ColumnIndex))
        {
            return cell1;
        }
        return null;
    }

    private List<CellNumberController> GetMidActiveBetweenTwoCell(CellNumberController cell1, CellNumberController cell2)
    {
        var mid = new List<CellNumberController>();
        if (cell1 == cell2) return mid;
        for (int k = 0; k < directions.Length; k++)
        {
            CellNumberController cell = CheckTwoCellInDirect(cell1, cell2, k);
            if (cell)
            {
                cell = GetCellLink(cell.RowIndex, cell.ColumnIndex, k);
                while (cell != cell1 && cell != cell2)
                {
                    mid.Add(cell);
                    cell = GetCellLink(cell.RowIndex, cell.ColumnIndex, k);
                }
                return mid;
            }
        }
        return mid;
    }

    private async UniTask HandleTwoCellSelected(CellNumberController cell1, CellNumberController cell2)
    {
        if (!CheckTwoCell(cell1, cell2))
        {
            return;
        }
        
        cell1.SetSelected(false);
        cell2.SetSelected(false);

        int row1 = cell1.RowIndex;
        int col1 = cell1.ColumnIndex;
        int row2 = cell2.RowIndex;
        int col2 = cell2.ColumnIndex;
        
        for (int k = 0; k < directions.Length; k++)
        {
            if (GetCellLink(row1, col1, k) == cell2)
            {
                await ClearCell(cell1, cell2, k, cell2.transform.position + new Vector3(0, _cellSize, 0));
                //await ClearCell(cell1, cell2, k, cell2.transform.position);
                return;
            }
            else if (GetCellLink(row2, col2, k) == cell1)
            {
                await ClearCell(cell2, cell1, k, cell2.transform.position + new Vector3(0, _cellSize, 0));
                //await ClearCell(cell2, cell1, k, cell2.transform.position);
                return;
            }
        }
        
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayNotMatchable"});
        var cells = GetMidActiveBetweenTwoCell(cell1, cell2);
        foreach (var cell in cells)
        {
            cell.ShakeOnce();
        }
        if(VibrationController.IsAlive)
            VibrationController.Instance.PlayVibration(ImpactFeedbackStyle.Medium);
        
    }
    #endregion
    
    #region Clear Cell & VFX

    private async UniTask ClearCell(CellNumberController cell1, CellNumberController cell2, int k, Vector3 scorePos)
    {
        Messenger.Default.Publish(new BeforeClearCellPayload());
        OffHintCell();
        
        Messenger.Default.Publish(new ClearNumberPayload()
            { number = Mathf.Abs(cell1.CellNumber), index = GetIndexByRowCol(cell1.RowIndex, cell1.ColumnIndex) });
        
        Messenger.Default.Publish(new ClearNumberPayload()
            { number = Mathf.Abs(cell2.CellNumber), index = GetIndexByRowCol(cell2.RowIndex, cell2.ColumnIndex) });
        
        var distance = FindCellLink(cell1.RowIndex, cell1.ColumnIndex, k);
        if (distance == 1 && k == (int)TableDirect.Right && cell1.RowIndex != cell2.RowIndex) distance = -1;
        cell1.SetCellNumber(cell1.CellNumber * (-1));
        cell2.SetCellNumber(cell2.CellNumber * (-1));
        
        CalClearCellScore(distance, scorePos);
        
        await PlayClearCellVfx(cell1, cell2, k);
        
        await ProcessDeleteRow(cell1, cell2);
        
        ResetLinkCell();
        _lastHaveNumberCell = FindLastHaveNumberCell();
        _roundDataAsset.SetNumbers(GetAllListNumberInTable());
        Messenger.Default.Publish(new AfterClearCellPayload());
        CheckWinLose();
    }

    private async UniTask PlayClearCellVfx(CellNumberController cell1, CellNumberController cell2, int direct)
    {
        if (direct == (int)TableDirect.Right && cell1.RowIndex != cell2.RowIndex)
        {
            await PlayClearCellVfx2(cell1.transform.position, cell2.transform.position,
                cell1.transform.position +
                new Vector3(
                    ((_columnNum - cell1.ColumnIndex - 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x), 0,
                    0),
                cell2.transform.position -
                new Vector3((cell2.ColumnIndex + 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x, 0, 0));
        }
        else
        {
            await PlayClearCellVfx1(cell1.transform.position, cell2.transform.position);
        }
    }

    private async UniTask PlayClearCellVfx1(Vector3 pos1, Vector3 pos2)
    {
        //ComboVfxClearCellController vfxClearCell = Instantiate(_vfxClearCellPrefab, transform);
        var vfxClearCell = GameObjectPool.Instance.Rent(_vfxClearCellPrefab.gameObject, _vfxParent).GetComponent<ComboVfxClearCellController>();
        vfxClearCell.SetUp(pos1, pos2, _cellSize);
        await vfxClearCell.Play();
    }
    
    private async UniTask PlayClearCellVfx2(Vector3 pos1, Vector3 pos2, Vector3 pos3, Vector3 pos4)
    {
        //ComboVfxClearCellController vfxClearCell = Instantiate(_vfxClearCellPrefab, transform);
        var vfxClearCell = GameObjectPool.Instance.Rent(_vfxClearCellPrefab.gameObject, _vfxParent).GetComponent<ComboVfxClearCellController>();
        vfxClearCell.SetUp2(pos1, pos2, pos3, pos4, _cellSize);
        await vfxClearCell.Play();
    }
    #endregion
    
    #region Delete Row & VFX

    public async UniTask ProcessDeleteRow(CellNumberController cell1, CellNumberController cell2)
    {
        await LockTable(true);
        if (cell1.RowIndex == cell2.RowIndex)
        {
            if (CheckDeleteRow(_table[cell1.RowIndex]))
            {
                await PlayVfxDeleteRow(_table[cell1.RowIndex][0].transform.position, _columnNum, _cellSize);
                DeleteRow(_table[cell1.RowIndex]);
            }
        }
        else
        {
            List<UniTask> tasks = new List<UniTask>();
            bool isDelete1 = CheckDeleteRow(_table[cell1.RowIndex]);
            bool isDelete2 = CheckDeleteRow(_table[cell2.RowIndex]);
            if (isDelete1)
            {
                tasks.Add(PlayVfxDeleteRow(_table[cell1.RowIndex][0].transform.position, _columnNum, _cellSize));
                tasks.Add(AddRowScore(_table[cell1.RowIndex]));
            }
            if (isDelete2)
            {
                tasks.Add(PlayVfxDeleteRow(_table[cell2.RowIndex][0].transform.position, _columnNum, _cellSize));
                tasks.Add(AddRowScore(_table[cell2.RowIndex]));
            }
            await UniTask.WhenAll(tasks);

            if (isDelete1)
            {
                DeleteRow(_table[cell1.RowIndex]);
            }

            if (isDelete2)
            {
                DeleteRow(_table[cell2.RowIndex]);
            }
        }
        await LockTable(false);
    }

    public bool CheckDeleteRow(List<CellNumberController> row)
    {
        for (int col = 0; col < _columnNum; col++)
        {
            if (row[col].IsActive) return false;
        }
        return true;
    }

    private async UniTask AddRowScore(List<CellNumberController> row)
    {
        await UniTask.WaitForSeconds(0.35f);
        Vector3 scorePos = ((row[^1].transform.position) + (row[0].transform.position)) / 2;
        AddScore(CalScoreStage(_scoreDeleteRow), scorePos);
    }

    private void DeleteRow(List<CellNumberController> row)
    {
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayClearRow"});
        AddRow();
        for (int i = 0; i < row.Count; i++)
        {
            row[i].gameObject.SetActive(false);
        }
        _table.Remove(row);
        _rowNum--;
        //LayoutRebuilder.ForceRebuildLayoutImmediate(_tableContainer);
        RefreshPosContent();
    }

    private async UniTask PlayVfxDeleteRow(Vector3 firstCellPos, int numCell, float cellSize)
    {
        //ComboVfxDeleteRowController vfxDeleteRow = Instantiate(_vfxDeleteRowPrefab, transform);
        var vfxDeleteRow = GameObjectPool.Instance.Rent(_vfxDeleteRowPrefab.gameObject, _vfxParent).GetComponent<ComboVfxDeleteRowController>();
        vfxDeleteRow.SetUp(firstCellPos, numCell, cellSize);
        await vfxDeleteRow.Play();
    }
    #endregion
    
    #region Add Number And Plus
    
    private async UniTask PlayVfxNewCell(Vector3 pos, float cellSize)
    {
        //UIParticle vfxNewCell = Instantiate(_vfxNewCellPrefab, transform);
        var vfxNewCell = GameObjectPool.Instance.Rent(_vfxNewCellPrefab.gameObject, _vfxParent).GetComponent<UIParticle>();
        vfxNewCell.transform.position = pos;
        vfxNewCell.scale = cellSize;
        vfxNewCell.Stop();
        vfxNewCell.Play();
        await UniTask.Delay(2000);
        //Destroy(vfxNewCell.gameObject);
        GameObjectPool.Instance.Return(vfxNewCell.gameObject);
    }

    private async UniTask AddListNumber(List<int> numbers, bool isisStartNew = false)
    {
        await LockTable(true);
        int count;
        if (_lastHaveNumberCell)
        {
            count = GetIndexByRowCol(_lastHaveNumberCell.RowIndex, _lastHaveNumberCell.ColumnIndex) + 1 + numbers.Count;
        }
        else
        {
            count = numbers.Count;
        }
        int rowActive = (count - 1) / _columnNum + 1;
        
        while(rowActive + 15 > _rowNum)
        {
            AddRow();
        }
        
        LayoutRebuilder.ForceRebuildLayoutImmediate(_tableContainer);
        RefreshHeightContent();
        RefreshPosContent();
        if (!_isTutorial)
        {
            await ScrollBeforeAddNumber(rowActive - 3);
        }
        CellNumberController oldCell = null;

        for (int i=0; i < numbers.Count; i++)
        {
            _lastHaveNumberCell = GetNextCell(_lastHaveNumberCell);
            _lastHaveNumberCell.SetCellNumber(numbers[i]);
            if (!_isTutorial && _lastHaveNumberCell.transform.position.y <= _startPos.position.y)
            {
                //SetScrollPos(ScrollPosRowEnd(_lastHaveNumberCell.RowIndex));
                PlayVfxNewCell(_lastHaveNumberCell.transform.position, _cellSize);
                //if (!isisStartNew) PlayVfxNewCell(GetCellByIndex(i).transform.position, _cellSize);
                if (!isisStartNew)
                {
                    if (oldCell == null) oldCell = GetCellActiveByIndex(0);
                    else oldCell = GetCellLink(oldCell.RowIndex, oldCell.ColumnIndex, (int)TableDirect.Right);
                    oldCell.SetOriginColorText();
                }
                //await UniTask.Delay(Mathf.Max(1,1000/numbers.Count));
                if ((GetIndexByRowCol(_lastHaveNumberCell.RowIndex, _lastHaveNumberCell.ColumnIndex) + 1) %
                    _columnNum == 0)
                {
                    await UniTask.WaitForSeconds(0.1f);
                    //await UniTask.NextFrame();
                }
                
            }
        }

        ResetLinkCell();
        _lastHaveNumberCell = FindLastHaveNumberCell();

        /*
        if (_lastHaveNumberCell)
        {
            SetScrollPos(ScrollPosRowEnd(_lastHaveNumberCell.RowIndex));
        }
        else
        {
            SetScrollPos(1f);
        }
        */
        await LockTable(false);
    }

    private async UniTask ScrollBeforeAddNumber(int rowActive, float duration = 0.3f)
    {
        var isScrollCompleted = false;
        if (_lastHaveNumberCell)
        {
            SetScrollPos(ScrollPosRowEnd(_lastHaveNumberCell.RowIndex));
        }
        else
        {
            SetScrollPos(1f);
        }

        var targetPos = ScrollPosRowEnd(rowActive);
        // Clamp để đảm bảo không ra khỏi [0, 1]
        targetPos = Mathf.Clamp01(targetPos);

        // Dừng tween cũ nếu có
        DOTween.Kill(_scrollRect);

        // Tween từ current đến target
        DOTween.To(
            () => _scrollRect.verticalNormalizedPosition,
            x => _scrollRect.verticalNormalizedPosition = x,
            targetPos,
            duration
        )
            .SetEase(Ease.OutCubic).SetTarget(_scrollRect)
            .SetTarget(_scrollRect)
            .OnComplete(() =>
            {
                isScrollCompleted = true;
            });
        
        await UniTask.WaitUntil(() => isScrollCompleted);
    }

    public async UniTask<bool> AddPlusNumber()
    {
        if (_isLocked) return false;
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayAddNumber"});
        var index = GetIndexByRowCol(_lastHaveNumberCell.RowIndex, _lastHaveNumberCell.ColumnIndex);
        ChangeColorPlus(index, false);
        //await UniTask.WaitForSeconds(0.2f);
        await AddListNumber(GetListNumberInTable());
        _roundDataAsset.SetNumbers(GetAllListNumberInTable());
        CheckAfterAddPlusNumber().Forget();
        return true;
    }
    
    private async UniTask CheckAfterAddPlusNumber()
    {
        await UniTask.DelayFrame(2);
        CheckWinLose();
    }
    
    

    private void ChangeColorPlus(int index, bool isRecover)
    {
        for (int i = 0; i <= index; i++)
        {
            var cell = GetCellByIndex(i);
            if (cell.IsActive)
            {
                if (!isRecover) cell.SetColorText(new Color32(0x00, 0x9C, 0xC9, 0xFF));
                else cell.SetOriginColorText();
            }
        }
    }
    #endregion
    
    #region Hint

    private List<CellNumberController> FindTwoCellCanSelect()
    {
        var cells = new List<CellNumberController>();
        for (int i = 0; i < _rowNum; i++)
        {
            for (int j = 0; j < _columnNum; j++)
            {
                var cell1 = _table[i][j];
                for (int k = 0; k < directions.Length; k++)
                {
                    var cell2 = GetCellLink(i, j, k);
                    if (CheckTwoCell(cell1, cell2))
                    {
                        cells.Add(cell1);
                        cells.Add(cell2);
                        return cells;
                    }
                }
            }
        }

        return cells;
    }

    private void OffHintCell()
    {
        if (_cellHints.Count < 2) return;
        _cellHints[0].SetHint(false);
        _cellHints[1].SetHint(false);
        _cellHints.Clear();
        _vfxAttachCell.Stop();
        _vfxAttachCell.transform.parent = transform;
    }

    public async UniTask<bool> HintCell(List<CellNumberController> cellHints)
    {
        await LockTable(true);
        List<CellNumberController> cells;
        
        if (cellHints == null || cellHints.Count < 2) cells = FindTwoCellCanSelect();
        else cells = cellHints;

        if (cells.Count < 2)
        {
            _vfxHint.Stop();
            _vfxHint.Play();
            await UniTask.WaitForSeconds(1f);
            Messenger.Default.Publish(new ButtonPlusSayPayload());
            await LockTable(false);
            return false;
        }
        
        OffHintCell();
        
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlaySuggestion"});
        _vfxHint.Stop();
        _vfxHint.Play();
        
        List<UniTask> tasks = new List<UniTask>();
        if (!(CheckCellFullInView(cells[0]) && CheckCellFullInView(cells[1])))
        {
            UniTask  task1 = ScrollBeforeAddNumber(Mathf.Max(cells[0].RowIndex, cells[1].RowIndex), 0.2f);
            tasks.Add(task1);
        }
        
        UniTask task2 = UniTask.WaitForSeconds(1f);
        tasks.Add(task2);
        await UniTask.WhenAll(tasks);
        
        cells[0].SetHint(true);
        cells[1].SetHint(true);

        _vfxAttachCell.transform.parent = _tableContainer;
        PlayVfxAttachCell(_vfxAttachCell, GetIndexByCell(cells[0]), GetIndexByCell(cells[1]));

        UniTask task3 = cells[0].PlayEffectHint();
        UniTask task4 =  cells[1].PlayEffectHint();
        await UniTask.WhenAll(task3, task4);
            
        _cellHints.Add(cells[0]);
        _cellHints.Add(cells[1]);
        await LockTable(false);
        return true;
    }

    public bool CheckCellFullInView(CellNumberController cell)
    {
        return (cell.transform.position.y <= _startPos.position.y - _cellSize/2) && (cell.transform.position.y >= _startPos.position.y - _viewPort.rect.height + _cellSize/2);
    }
    
    #endregion
    
    #region Score & State Check

    private async UniTask CalClearCellScore(int distance, Vector3 scorePos)
    {
        await UniTask.WaitForSeconds(0.2f);
        if (distance == 1)
        {
            await AddScore(CalScoreStage(_scoreOne), scorePos);
        }

        if (distance == -1)
        {
            await AddScore(CalScoreStage(_scoreTwo), scorePos);
        }

        if (distance > 1)
        {
            await AddScore(CalScoreStage(_scoreHaveSpace), scorePos);
        }
    }

    private int CalScoreStage(int baseScore)
    {
        int stage = _roundDataAsset.CurrentData.stage;
        float score = baseScore * (1.0f + (stage - 1) * _score_increae_rate);
        return Mathf.FloorToInt(score);
    }

    private async UniTask AddScore(int score, Vector3 position)
    {
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayScoring"});
        var scoreEffect = GameObjectPool.Instance.Rent(_scoreEffectPrefab, _vfxParent, position, Quaternion.identity)
            .GetComponent<ScoreEffectControler>();
        scoreEffect.SetScore(score);
        _roundDataAsset.AddScore(score);
        await scoreEffect.Play();
        GameObjectPool.Instance.Return(scoreEffect.gameObject);
    }

    private void CheckWinLose()
    {
        if (_isTutorial) return;
        if (!_lastHaveNumberCell)
        {
            _homeDataAsset.NumberMatchEnd++;
            NextStage();
        }
        else
        {
            if (_roundDataAsset.CurrentData.plus <= 0 && FindTwoCellCanSelect().Count < 2)
            {
                _homeDataAsset.NumberMatchEnd++;
                StageEnd();
            }
        }
        
    }

    private async void NextStage()
    {
        Messenger.Default.Publish(new PlaySoundMethodPayload{method = "PlayClearGameBoard"});
        await AddScore(CalScoreStage(_scoreDeleteTable),
            (_table[1][0].transform.position + _table[1][^1].transform.position) / 2);
        if (!_roundDataAsset.IsChallengeComplete)
        {
            _numberMatchGamePlayLogic?.ShowPopupStageComplete();
        }
    }

    private async void StageEnd()
    {
        var informStatus = new InGameInFormStatus();
        Messenger.Default.Publish(new NoMoreMatchesPayload(){status = informStatus});
        await UniTask.WaitUntil(() => informStatus.IsCompleted);
        
        if (_roundDataAsset.IsChallenge)
        {
            if (!_roundDataAsset.CurrentData.isOverBestScore)
            {
                _numberMatchGamePlayLogic?.ShowPopupChallengeEnd();
            }
        }
        else
        {
            _numberMatchGamePlayLogic?.ShowPopupStageEnd();
        }
    }
    
    #endregion

    #region Release Cell & Mask Cell
    public void ReleaseCellByIndex(int index)
    {
        var cell = GetCellByIndex(index);
        cell.SetCallBack(OnCellClicked);
        cell.SetMask(false);
    }
    
    public void ReleaseAllCell()
    {
        for (int i = 0; i < _rowNum; i++)
        {
            for (int j = 0; j < _columnNum; j++)
            {
                var cell = _table[i][j];
                cell.SetCallBack(OnCellClicked);
                cell.SetMask(false);
            }
        }
    }

    public void RemoveMask()
    {
        for (int i = 0; i < _rowNum; i++)
        {
            for (int j = 0; j < _columnNum; j++)
            {
                var cell = _table[i][j];
                cell.SetMask(false);
            }
        }
    }

    public void PlayVfxAttachCell(ComboVfxAttachCellController vfx, int index1, int index2)
    {
        var cell1 = GetCellByIndex(index1);
        var cell2 = GetCellByIndex(index2);
        
        int row1 = cell1.RowIndex;
        int col1 = cell1.ColumnIndex;
        int row2 = cell2.RowIndex;
        int col2 = cell2.ColumnIndex;

        int direct = 0;
        
        for (int k = 0; k < directions.Length; k++)
        {
            if (GetCellLink(row1, col1, k) == cell2)
            {
                direct = k;
                break;
            }
            else if (GetCellLink(row2, col2, k) == cell1)
            {
                direct = k;
                (cell1, cell2) = (cell2, cell1);
                break;
            }
        }
        vfx.gameObject.SetActive(true);
        var offset1 = (new Vector3(directions[direct].y,directions[direct].x * (-1), 0)) * (_cellSize * 1 / 3);
        var offset2 = (new Vector3(directions[direct].y,directions[direct].x * (-1), 0)) * (-1) * (_cellSize * 1 / 3);
        offset1 = Vector3.zero;
        offset2 = Vector3.zero;
        if (direct == (int)TableDirect.Right && cell1.RowIndex != cell2.RowIndex)
        {
            vfx.SetUpAndPlay2(cell1.transform.position + offset1,
                cell1.transform.position + new Vector3(((_columnNum - cell1.ColumnIndex - 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x), 0, 0),
                cell2.transform.position - new Vector3((cell2.ColumnIndex + 0.5f) * _cellSize * _tableContainer.transform.lossyScale.x, 0, 0),
                cell2.transform.position + offset2);
        }
        else
        {
            vfx.SetUpAndPlay1(cell1.transform.position + offset1, cell2.transform.position + offset2);
        }
        
    }
    
    #endregion

    #region Table Size Change
    private void RefreshHeightContent()
    {
        SetScrollPos(1f);
        _tableContainer.sizeDelta = new Vector2(_tableContainer.sizeDelta.x, _cellSize * _rowNum);
    }
    
    private async UniTask LockTable(bool isLocked)
    {
        if (isLocked)
        {
            await UniTask.WaitUntil(() => !_isLocked);
        }
        _isLocked = isLocked;
        _lock.gameObject.SetActive(isLocked);
        _scrollRect.enabled = !isLocked;
    }

    public void DecreaseSizeTutorial()
    {
        _tableRect.sizeDelta = new Vector2(_tableRect.sizeDelta.x, _tableRect.sizeDelta.y - _cellSize);
    }
    #endregion
}
```
