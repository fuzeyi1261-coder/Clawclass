import React, { useEffect, useRef } from 'react';
import { useScheduleStore, startScheduleCheck, stopScheduleCheck } from '../store/scheduleStore';

interface CoverControllerProps {
  onCoverShow?: (message: string, subMessage?: string, duration?: number) => void;
  onCoverHide?: () => void;
  onCoverHomework?: (homeworks: Array<{ subject: string; content: string; title: string }>) => void;
}

export function CoverController({ onCoverShow, onCoverHide, onCoverHomework }: CoverControllerProps) {
  const { 
    isClassTime, 
    currentClass, 
    nextClass, 
    coverConfig,
    homeworkList,
    checkCurrentTime,
    loadSchedule,
    loadHomeworks
  } = useScheduleStore();
  
  const lastCoverState = useRef<'show' | 'hide' | null>(null);

  useEffect(() => {
    // 启动定时检查
    startScheduleCheck();

    return () => {
      stopScheduleCheck();
    };
  }, []);

  // 当上课状态变化时，发送IPC消息
  useEffect(() => {
    if (!coverConfig.enabled) return;

    checkCurrentTime();

    const now = new Date();
    const weekday = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // 检查是否在特殊时段
    const isMorningRead = weekday >= 1 && weekday <= 5 && 
      currentTime >= 7 * 60 + 58 && currentTime <= 8 * 60 + 1; // 7:58 - 8:01 早读
    const isEveningStudy = currentTime >= 19 * 60 && currentTime <= 21 * 60 + 30; // 晚自习

    // 晚自习上课时段，隐藏遮罩
    if (currentClass?.subject === '晚自习上课') {
      if (lastCoverState.current !== 'hide') {
        lastCoverState.current = 'hide';
        if (onCoverHide) onCoverHide();
      }
      return;
    }

    // 晚自习（不上课）显示作业
    if (currentClass?.subject === '晚自习' || isEveningStudy) {
      if (onCoverHomework && homeworkList.length > 0) {
        lastCoverState.current = 'homework';
        onCoverHomework(homeworkList.map(h => ({
          subject: h.subject,
          content: h.content || h.title,
          title: h.title
        })));
      }
      return;
    }

    // 早读时间显示作业
    if (isMorningRead) {
      if (onCoverHomework && homeworkList.length > 0) {
        lastCoverState.current = 'homework';
        onCoverHomework(homeworkList.map(h => ({
          subject: h.subject,
          content: h.content || h.title,
          title: h.title
        })));
      }
      return;
    }

    if (!isClassTime) {
      // 非上课时间，显示遮罩
      if (lastCoverState.current !== 'show') {
        lastCoverState.current = 'show';
        let message = '非上课时间';
        let subMessage = nextClass ? `下一节: ${nextClass.subject} (${nextClass.start_time || ''})` : '休息中';
        
        if (onCoverShow) {
          onCoverShow(message, subMessage);
        }
      }
    } else {
      // 上课时间，隐藏遮罩
      if (lastCoverState.current !== 'hide') {
        lastCoverState.current = 'hide';
        if (onCoverHide) {
          onCoverHide();
        }
      }
    }
  }, [isClassTime, currentClass, nextClass, coverConfig.enabled, homeworkList]);

  return null; // 这是一个无渲染组件
}

// 获取当前状态的Hook
export function useCoverStatus() {
  const { isClassTime, currentClass, nextClass, coverConfig } = useScheduleStore();
  
  return {
    isClassTime,
    currentClass,
    nextClass,
    coverEnabled: coverConfig.enabled,
  };
}
