/*
 * @Author: Laoluo luozefeng@sensetime.com
 * @Date: 2022-06-22 11:08:31
 * @LastEditors: Laoluo luozefeng@sensetime.com
 */
import { getClassName } from '@/utils/dom';
import { FooterDivider } from '@/views/MainView/toolFooter';
import { ZoomController } from '@/views/MainView/toolFooter/ZoomController';
import { DownSquareOutlined, UpSquareOutlined } from '@ant-design/icons';
import { cTool, PointCloudAnnotation } from '@labelwu/lb-annotation';
import { IPolygonData, PointCloudUtils, UpdatePolygonByDragList } from '@labelwu/lb-utils';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PointCloudContext } from './PointCloudContext';
import { useRotate } from './hooks/useRotate';
import { useSingleBox } from './hooks/useSingleBox';
import { PointCloudContainer } from './PointCloudLayout';
import { BoxInfos, PointCloudValidity } from './PointCloudInfos';
import { usePolygon } from './hooks/usePolygon';
import { useZoom } from './hooks/useZoom';
import { Slider } from 'antd';
import { a2MapStateToProps, IA2MapStateProps, IAnnotationStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { usePointCloudViews } from './hooks/usePointCloudViews';
import useSize from '@/hooks/useSize';
import { useTranslation } from 'react-i18next';
import { LabelBeeContext } from '@/store/ctx';
import { jsonParser } from '@/utils';
import { TDrawLayerSlot } from '@/types/main';

const { EPolygonPattern } = cTool;

/**
 * Get the offset from canvas2d-coordinate to world coordinate (Top View)
 * @param currentPos
 * @param size
 * @param zoom
 * @returns
 */
const TransferCanvas2WorldOffset = (
  currentPos: { x: number; y: number },
  size: { width: number; height: number },
  zoom = 1,
) => {
  const { width: w, height: h } = size;

  const canvasCenterPoint = {
    x: currentPos.x + (w * zoom) / 2,
    y: currentPos.y + (h * zoom) / 2,
  };

  const worldCenterPoint = {
    x: size.width / 2,
    y: size.height / 2,
  };

  return {
    offsetX: (worldCenterPoint.x - canvasCenterPoint.x) / zoom,
    offsetY: -(worldCenterPoint.y - canvasCenterPoint.y) / zoom,
  };
};

const TopViewToolbar = ({ currentData }: IAnnotationStateProps) => {
  const { zoom, zoomIn, zoomOut, initialPosition } = useZoom();
  const { selectNextBox, selectPrevBox } = useSingleBox();
  const { updateRotate } = useRotate({ currentData });

  const ratio = 2;

  const clockwiseRotate = () => {
    updateRotate(-ratio);
  };
  const anticlockwiseRotate = () => {
    updateRotate(ratio);
  };

  const reverseRotate = () => {
    updateRotate(180);
  };

  return (
    <>
      <span
        onClick={anticlockwiseRotate}
        className={getClassName('point-cloud', 'rotate-reserve')}
      />
      <span onClick={clockwiseRotate} className={getClassName('point-cloud', 'rotate')} />
      <span onClick={reverseRotate} className={getClassName('point-cloud', 'rotate-180')} />
      <FooterDivider />
      <UpSquareOutlined
        onClick={() => {
          selectPrevBox();
        }}
        className={getClassName('point-cloud', 'prev')}
      />
      <DownSquareOutlined
        onClick={() => {
          selectNextBox();
        }}
        className={getClassName('point-cloud', 'next')}
      />
      <FooterDivider />
      <ZoomController
        initialPosition={initialPosition}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        zoom={zoom}
      />
    </>
  );
};

/**
 * Slider for filtering Z-axis points
 */
const ZAxisSlider = ({
  setZAxisLimit,
  zAxisLimit,
  checkMode,
}: {
  setZAxisLimit: (value: number) => void;
  zAxisLimit: number;
  checkMode?: boolean;
}) => {
  if (checkMode) {
    return null;
  }

  return (
    <div style={{ position: 'absolute', top: 128, right: 8, height: '50%', zIndex: 20 }}>
      <Slider
        vertical
        step={0.5}
        max={10}
        min={0.5}
        defaultValue={zAxisLimit}
        onAfterChange={(v: number) => {
          setZAxisLimit(v);
        }}
      />
    </div>
  );
};

interface IProps extends IA2MapStateProps {
  drawLayerSlot?: TDrawLayerSlot;
  checkMode?: boolean;
}

const PointCloudTopView: React.FC<IProps> = ({
  currentData,
  imgList,
  stepInfo,
  drawLayerSlot,
  checkMode,
}) => {
  const [annotationPos, setAnnotationPos] = useState({ zoom: 1, currentPos: { x: 0, y: 0 } });
  const ref = useRef<HTMLDivElement>(null);
  const ptCtx = React.useContext(PointCloudContext);
  const size = useSize(ref);
  const config = jsonParser(stepInfo.config);
  const { setZoom } = useZoom();
  const { hideAttributes } = ptCtx;

  const { addPolygon, deletePolygon } = usePolygon();
  const { deletePointCloudBox, changeValidByID } = useSingleBox();
  const [zAxisLimit, setZAxisLimit] = useState<number>(10);
  const { t } = useTranslation();
  const pointCloudViews = usePointCloudViews();

  useLayoutEffect(() => {
    if (ptCtx.topViewInstance) {
      return;
    }

    if (ref.current && currentData?.url && currentData?.result) {
      const size = {
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      };

      const pointCloudAnnotation = new PointCloudAnnotation({
        container: ref.current,
        size,
        pcdPath: currentData.url,
        config,
        checkMode,
      });

      ptCtx.setTopViewInstance(pointCloudAnnotation);
    }
  }, [currentData]);

  useEffect(() => {
    if (!size || !ptCtx.topViewInstance || !ptCtx.sideViewInstance) {
      return;
    }

    const { pointCloud2dOperation: TopView2dOperation } = ptCtx.topViewInstance;

    TopView2dOperation.singleOn('polygonCreated', (polygon: IPolygonData, zoom: number) => {
      if (TopView2dOperation.pattern === EPolygonPattern.Normal || !currentData?.url) {
        /**
         * Notice. The Polygon need to be converted to pointCloud coordinate system for storage.
         */
        const newPolygon = {
          ...polygon,
          pointList: polygon.pointList.map((v) => PointCloudUtils.transferCanvas2World(v, size)),
        };

        addPolygon(newPolygon);
        ptCtx.setSelectedIDs(hideAttributes.includes(polygon.attribute) ? '' : polygon.id);
        return;
      }

      pointCloudViews.topViewAddBox({
        newPolygon: polygon,
        size,
        imgList,
        trackConfigurable: config.trackConfigurable,
        zoom,
      });
    });

    TopView2dOperation.singleOn('deletedObject', ({ id }) => {
      deletePointCloudBox(id);
      deletePolygon(id);
    });

    TopView2dOperation.singleOn('deleteSelectedIDs', () => {
      ptCtx.setSelectedIDs([]);
    });

    TopView2dOperation.singleOn('addSelectedIDs', (selectedID: string) => {
      ptCtx.addSelectedID(selectedID);
    });

    TopView2dOperation.singleOn('setSelectedIDs', (selectedIDs: string[]) => {
      ptCtx.setSelectedIDs(selectedIDs);
    });

    TopView2dOperation.singleOn('updatePolygonByDrag', (updateList: UpdatePolygonByDragList) => {
      pointCloudViews.topViewUpdateBox?.(updateList, size);
    });

    const validUpdate = (id: string) => {
      // UpdateData.
      const newPointCloudList = changeValidByID(id);

      // HighLight
      if (newPointCloudList) {
        ptCtx.syncAllViewPointCloudColor(newPointCloudList);
      }
      if (ptCtx.polygonList.find((v) => v.id === id)) {
        ptCtx.topViewInstance?.pointCloud2dOperation.setPolygonValidAndRender(id, true);
      }
    };

    TopView2dOperation.on('validUpdate', validUpdate);

    return () => {
      TopView2dOperation.unbind('validUpdate', validUpdate);
    };
  }, [ptCtx, size, currentData, pointCloudViews, ptCtx.polygonList]);

  useEffect(() => {
    if (!size?.width || !ptCtx.topViewInstance) {
      return;
    }
    /**
     * Init Config
     *
     * 1. Update defaultAttribute by first attribute;
     *  */
    const defaultAttribute = config?.attributeList?.[0]?.value;
    if (defaultAttribute) {
      ptCtx.topViewInstance.pointCloud2dOperation.setDefaultAttribute(defaultAttribute);
    }

    // 1. Update Size
    ptCtx.topViewInstance.initSize(size);
    ptCtx.topViewInstance.updatePolygonList(ptCtx.displayPointCloudList, ptCtx.polygonList);

    const {
      topViewInstance: { pointCloudInstance: pointCloud, pointCloud2dOperation: polygonOperation },
    } = ptCtx;

    /**
     * Synchronized 3d point cloud view displacement operations
     *
     * Change Orthographic Camera size
     */
    polygonOperation.singleOn('renderZoom', (zoom: number, currentPos: any) => {
      const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
      pointCloud.camera.zoom = zoom;
      if (currentPos) {
        const { x, y, z } = pointCloud.initCameraPosition;
        pointCloud.camera.position.set(x + offsetY, y - offsetX, z);
      }

      pointCloud.camera.updateProjectionMatrix();
      pointCloud.render();

      setZoom(zoom);
      setAnnotationPos({ zoom, currentPos });
    });

    // Synchronized 3d point cloud view displacement operations
    polygonOperation.singleOn('dragMove', ({ currentPos, zoom }) => {
      const { offsetX, offsetY } = TransferCanvas2WorldOffset(currentPos, size, zoom);
      pointCloud.camera.zoom = zoom;
      const { x, y, z } = pointCloud.initCameraPosition;
      pointCloud.camera.position.set(x + offsetY, y - offsetX, z);
      pointCloud.render();
      setAnnotationPos({ zoom, currentPos });
    });
  }, [size, ptCtx.topViewInstance]);

  useEffect(() => {
    ptCtx.topViewInstance?.pointCloudInstance?.applyZAxisPoints(zAxisLimit);
  }, [zAxisLimit]);

  useEffect(() => {
    pointCloudViews.topViewSelectedChanged();
  }, [ptCtx.selectedIDs]);

  return (
    <PointCloudContainer
      className={getClassName('point-cloud-container', 'top-view')}
      title={t('TopView')}
      toolbar={<TopViewToolbar currentData={currentData} />}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{ width: '100%', height: '100%' }} ref={ref}>
          {drawLayerSlot?.(annotationPos)}
        </div>

        <BoxInfos checkMode={checkMode} config={config} />
        <ZAxisSlider checkMode={checkMode} zAxisLimit={zAxisLimit} setZAxisLimit={setZAxisLimit} />
        <PointCloudValidity />
      </div>
    </PointCloudContainer>
  );
};

export default connect(a2MapStateToProps, null, null, { context: LabelBeeContext })(
  PointCloudTopView,
);
