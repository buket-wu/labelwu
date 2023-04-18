/**
 * It can expand various types of operations
 *
 * @file PointCloud 2D Operation
 * @createdate 2022-07-11
 * @author Ron <ron.f.luo@gmail.com>
 */

import { IPointCloudConfig, toolStyleConverter, UpdatePolygonByDragList, INVALID_COLOR } from '@labelwu/lb-utils';
import { EDragTarget, ESortDirection } from '@/constant/annotation';
import { EPolygonPattern } from '@/constant/tool';
import { IPolygonData, IPolygonPoint } from '@/types/tool/polygon';
import AxisUtils from '@/utils/tool/AxisUtils';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import DrawUtils from '@/utils/tool/DrawUtils';
import PolygonUtils from '@/utils/tool/PolygonUtils';
import { polygonConfig } from '@/constant/defaultConfig';
import _ from 'lodash';
import PolygonOperation, { IPolygonOperationProps } from './polygonOperation';
import { BasicToolOperation } from './basicToolOperation';

interface IPointCloud2dOperationProps {
  showDirectionLine?: boolean;
  forbidAddNew?: boolean;
  checkMode?: boolean; // Judgement of check Mode
}

class PointCloud2dOperation extends PolygonOperation {
  public showDirectionLine: boolean;

  public hideAttributes: string[];

  public forbidAddNew: boolean;

  public pointCloudConfig: IPointCloudConfig;

  private checkMode: boolean;

  private selectedIDs: string[] = [];

  constructor(props: IPolygonOperationProps & IPointCloud2dOperationProps) {
    super(props);

    this.showDirectionLine = props.showDirectionLine ?? true;
    this.forbidAddNew = props.forbidAddNew ?? false;
    this.pointCloudConfig = CommonToolUtils.jsonParser(props.config) ?? {};
    this.hideAttributes = [];
    this.checkMode = props.checkMode ?? false;

    // Check Mode automatically opens forbidAddNew.
    if (this.forbidAddNew === false && props.checkMode === true) {
      this.forbidAddNew = true;
    }

    // Set the default
    this.config = {
      ...polygonConfig,
      textConfigurable: false,
      attributeConfigurable: true,
      attributeList: this.pointCloudConfig?.attributeList ?? [],
    };
  }

  get getSelectedIDs() {
    return this.selectedIDs;
  }

  get enableDrag() {
    return Boolean(this.selectedIDs.length > 0 && this.dragInfo);
  }

  get visiblePolygonList() {
    return this.polygonList.filter((i) => !this.hideAttributes.includes(i.attribute));
  }

  public setHiddenAttributes(hideAttributes: string[]) {
    this.hideAttributes = hideAttributes;
  }

  public setConfig(config: string) {
    const newConfig = CommonToolUtils.jsonParser(config);
    this.pointCloudConfig = newConfig;
    this.config = {
      ...this.config,
      attributeList: newConfig?.attributeList ?? [],
    };
  }

  public dragMouseDown(e: MouseEvent) {
    if (this.checkMode) {
      return;
    }

    super.dragMouseDown(e);
  }

  public deletePolygon(id?: string) {
    if (this.checkMode) {
      return;
    }

    super.deletePolygon(id);
  }

  public deletePolygonPoint(index: number) {
    if (this.checkMode) {
      return;
    }

    super.deletePolygonPoint(index);
  }

  /**
   * Update selectedIDs and rerender
   * @param selectedIDs
   */
  public setSelectedIDs(selectedIDs: string[]) {
    this.selectedIDs = selectedIDs;

    if (this.selectedIDs.length < 2) {
      this.setSelectedID(this.selectedIDs.length === 1 ? this.selectedIDs[0] : '');
    }

    this.render();
  }

  public deleteSelectedID() {
    super.deleteSelectedID();
    /** ID not existed and empty selectedID */
    this.selectedIDs = [];
    this.emit('deleteSelectedIDs');
  }

  /**
   * Right click event
   * @override
   */
  public rightMouseUp = (e: MouseEvent) => {
    if (this.drawingPointList.length > 0) {
      this.addDrawingPointToPolygonList();
      return;
    }

    /**
     * Multi Selected.
     */
    if (e.ctrlKey) {
      this.emit('addSelectedIDs', this.hoverID);
      return;
    }

    this.emit('setSelectedIDs', this.hoverID);
    const hoverAttribute = this.polygonList.find((v) => v.id === this.hoverID)?.attribute;
    if (hoverAttribute && hoverAttribute !== this.defaultAttribute) {
      this.emit('syncAttribute', hoverAttribute);
    }
  };

  public get selectedPolygons() {
    return PolygonUtils.getPolygonByIDs(this.polygonList, this.selectedIDs);
  }

  public updateSelectedPolygonsPoints(offset: Partial<ICoordinate>) {
    if (this.selectedPolygons && this.selectedPolygons?.length > 0) {
      const originPolygonList = _.cloneDeep(this.selectedPolygons!);
      const updateList: UpdatePolygonByDragList = [];

      this.selectedPolygons?.forEach((polygon, index) => {
        polygon.pointList = polygon.pointList.map((point) => {
          const { x, y } = point;
          return {
            ...point,
            x: x + (offset.x ?? 0),
            y: y + (offset.y ?? 0),
          };
        });

        updateList.push({ originPolygon: originPolygonList[index], newPolygon: polygon });
      });

      this.emit('updateResult');
      this.emit('updatePolygonByDrag', updateList);
      this.render();

      this.history.pushHistory(this.polygonList);
    }
  }

  /**
   * keydown event
   * @override
   */
  public onKeyDown = () => {};

  /**
   * keyup event
   * @override
   */
  public onKeyUp = () => {};

  public getLineColor() {
    return 'rgba(0, 255, 255, 0.5)';
  }

  /** 获取当前属性颜色 */
  public getPointCloudLineColor(polygon: IPolygonData) {
    return polygon.valid === false
      ? INVALID_COLOR
      : toolStyleConverter.getColorFromConfig(
          { attribute: polygon.attribute },
          { ...this.pointCloudConfig, attributeConfigurable: true },
          {},
        ).stroke;
  }

  /**
   * Add direction
   * @override
   * */
  public renderStaticPolygon() {
    if (this.isHidden === false) {
      this.visiblePolygonList?.forEach((polygon) => {
        if ([...this.selectedIDs, this.editPolygonID].includes(polygon.id)) {
          return;
        }
        const lineColor = this.getPointCloudLineColor(polygon);
        const transformPointList = AxisUtils.changePointListByZoom(polygon.pointList || [], this.zoom, this.currentPos);

        DrawUtils.drawPolygonWithFillAndLine(this.canvas, transformPointList, {
          fillColor: 'transparent',
          strokeColor: lineColor,
          pointColor: 'white',
          thickness: this.style?.width ?? 2,
          lineCap: 'round',
          isClose: true,
          lineType: this.config?.lineType,
        });

        // Only the rectangle shows the direction.
        if (polygon.isRect === true && this.showDirectionLine === true) {
          this.renderRectPolygonDirection(transformPointList);
        }
      });
    }
  }

  /**
   * Update the show
   * @override
   * */
  public renderSelectedPolygon() {
    this.selectedPolygons?.forEach((polygon) => {
      this.renderSingleSelectedPolygon(polygon);
    });
  }

  public renderSingleSelectedPolygon = (selectedPolygon: IPolygonData) => {
    if (selectedPolygon) {
      const color = this.getPointCloudLineColor(selectedPolygon);
      const polygon = AxisUtils.changePointListByZoom(selectedPolygon.pointList, this.zoom, this.currentPos);

      DrawUtils.drawSelectedPolygonWithFillAndLine(this.canvas, polygon, {
        fillColor: 'transparent',
        strokeColor: color,
        pointColor: 'white',
        thickness: 2,
        lineCap: 'round',
        isClose: true,
        lineType: this.config?.lineType,
      });

      // Only the rectangle shows the direction.
      if (selectedPolygon.isRect === true && this.showDirectionLine === true) {
        this.renderRectPolygonDirection(polygon);
      }
    }
  };

  public renderRectPolygonDirection(polygon: IPolygonPoint[]) {
    if (polygon.length < 2) {
      return;
    }

    DrawUtils.drawLine(this.canvas, polygon[0], polygon[1], {
      color: 'white',
      thickness: 3,
      lineDash: [6],
    });
  }

  public get currentPolygonListByPattern() {
    return this.polygonList.filter((v) => {
      if (this.pattern === EPolygonPattern.Rect) {
        return v.isRect === true;
      }

      if (this.pattern === EPolygonPattern.Normal) {
        return v.isRect !== true;
      }

      return true;
    });
  }

  /**
   * Filter the polygon by Pattern
   * @override
   * */
  public getHoverID(e: MouseEvent) {
    const coordinate = this.getCoordinateUnderZoom(e);

    // Key Point!
    const currentPolygonList = this.currentPolygonListByPattern;

    const polygonListWithZoom = currentPolygonList.map((polygon) => ({
      ...polygon,
      pointList: AxisUtils.changePointListByZoom(polygon.pointList, this.zoom),
    }));
    return PolygonUtils.getHoverPolygonID(coordinate, polygonListWithZoom, 10, this.config?.lineType);
  }

  /**
   * Filter the polygon by Pattern
   * @override
   * */
  public switchToNextPolygon(sort: ESortDirection = ESortDirection.ascend) {
    // If it is in drawing, return;
    if (this.drawingPointList.length > 0) {
      return;
    }

    // Compared to the original filtering of patterns
    const sortList = this.currentPolygonListByPattern.map((v) => ({
      ...v,
      x: v.pointList[0]?.x ?? 0, // Sort with the first point.
      y: v.pointList[0]?.y ?? 0,
    }));

    const nextSelectedResult = CommonToolUtils.getNextSelectedRectID(sortList, sort, this.selectedID);
    if (nextSelectedResult) {
      this.setSelectedIDs([nextSelectedResult.id]);
      this.render();
      return [nextSelectedResult.id];
    }
  }

  /**
   * Be selected after created.
   * @override
   */
  public setSelectedIdAfterAddingDrawing(newID: string) {
    if (this.drawingPointList.length === 0) {
      return;
    }

    this.setSelectedID(newID);
  }

  public updateTextAttribute(newID?: string) {
    const oldID = this.selectedID;
    if (newID !== oldID && oldID) {
      // 触发文本切换的操作

      this._textAttributInstance?.changeSelected();
    }

    if (!newID) {
      this._textAttributInstance?.clearTextAttribute();
    }
  }

  /**
   * Overwrite and prevent selectedChange emit
   * @override
   */
  public setSelectedID(newID?: string) {
    this.updateTextAttribute(newID);
    this.selectedID = newID;

    this.render();
  }

  public addPointInDrawing(e: MouseEvent) {
    if (this.forbidAddNew) {
      return;
    }
    super.addPointInDrawing(e);
  }

  /**
   * Update canvas size directly
   * @param size
   */
  public setCanvasSize(size: ISize) {
    const pixel = this.pixelRatio;

    // Init Data
    this.size = size;
    this.setImgInfo(size);

    // Update canvas size.
    this.updateCanvasBasicStyle(this.basicCanvas, size, 0);
    this.updateCanvasBasicStyle(this.canvas, size, 10);
    this.ctx?.scale(pixel, pixel);
    this.basicCtx?.scale(pixel, pixel);

    // Restore to the initialization position
    this.initImgPos();

    // Render
    this.renderBasicCanvas();
    this.render();
  }

  /**
   * If the operation is triggered internally, it will emit validUpdate.
   *
   * The Invalid update needs to be added a params.
   * @override
   * @param id
   * @param forbidEmit
   * @returns
   */
  public setPolygonValidAndRender(id: string, isUpdate = false) {
    if (isUpdate) {
      super.setPolygonValidAndRender(id);
      return;
    }

    this.emit('validUpdate', id);
  }

  public onDragMove(e: MouseEvent) {
    const newPolygonList = this.polygonList.map((v) => {
      if (this.selectedIDs.includes(v.id)) {
        const selectedPointList = this.dragPolygon(e, v);

        if (!selectedPointList) {
          return v;
        }

        const newData = {
          ...v,
          pointList: selectedPointList as IPolygonPoint[],
        };

        // 非矩形模式下拖动，矩形模式下生成的框将会转换为非矩形框
        if (v.isRect === true && this.pattern === EPolygonPattern.Normal) {
          Object.assign(newData, { isRect: false });
        }

        return newData;
      }

      return v;
    });

    this.dragInfo!.dragPrevCoord = this.getCoordinateUnderZoom(e);

    this.setPolygonList(newPolygonList);
    this.render();
  }

  public onMouseDown(e: MouseEvent) {
    if (
      BasicToolOperation.prototype.onMouseDown.call(this, e) ||
      this.forbidMouseOperation ||
      e.ctrlKey === true ||
      e.button !== 0
    ) {
      return;
    }

    if (this.selectedIDs.length < 2) {
      return super.onMouseDown(e);
    }

    const dragStartCoord = this.getCoordinateUnderZoom(e);

    this.dragInfo = {
      dragStartCoord,
      dragTarget: EDragTarget.Plane,
      initPointList: [],
      changePointIndex: [0],
      originPolygon: this.selectedPolygon,
      dragPrevCoord: dragStartCoord,
      originPolygonList: this.polygonList,
    };
  }

  /**
   *  Just Update Data. Not Clear Status
   * @param polygonList
   */
  public setResultAndSelectedID(polygonList: IPolygonData[], selectedID: string) {
    this.setPolygonList(polygonList);
    this.setSelectedIDs([selectedID]);
  }

  public emitUpdatePolygonByDrag = () => {
    if (this.dragInfo) {
      const { originPolygonList } = this.dragInfo;

      if (this.selectedIDs.length > 0) {
        const emitUpdateList: UpdatePolygonByDragList = [];

        this.polygonList.forEach((polygon) => {
          if (this.selectedIDs.includes(polygon.id)) {
            const originPolygon = originPolygonList.find((i) => i.id === polygon.id);

            if (originPolygon) {
              emitUpdateList.push({ newPolygon: polygon, originPolygon });
            }
          }
        });
        this.emit('updatePolygonByDrag', emitUpdateList);
      }
    }
  };
}

export default PointCloud2dOperation;

export { IPointCloud2dOperationProps };
